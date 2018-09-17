import { Address } from './networking/EventWire';
import { BotConfig } from './planetwars/BotRunner';
import { PwClient } from './planetwars/PwClient';
import { Connected, ClientConnected, ClientDisconnected, StartGame } from './eventTypes';
import * as events from './eventTypes';
import { PwMatch } from './planetwars/PwMatch';
import { createWriteStream } from 'fs';
import { Logger } from './Logger';
import * as crypto from 'crypto';
import { ServerControl } from './ServerControl';
import { TcpStreamHandler } from './networking/TcpStreamHandler';

import * as sodium from 'libsodium-wrappers';

const publicKey = Buffer.from("da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d", 'hex');
const secretKey = Buffer.from("ea0d1f3d3051c83073d1ea77fcd2d5c7058c134d8b2d8291732e0793268c9127da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d", 'hex');


const addr: Address = {
    host: "127.0.0.1",
    port: 9142
};

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../planetwars/bots/simplebot/simple.py"],
}

const BIN_PATH = "../gameserver/target/debug/mozaic_bot_driver";

const players = [
    {
        name: 'timp',
        botConfig: simpleBot,
        number: 1,
    },
    {
        name: 'bert',
        botConfig: simpleBot,
        number: 2,
    }
];

const gameConfig = {
    mapPath: "../planetwars/maps/hex.json",
    maxTurns: 100,
}

const logStream = createWriteStream('log.out');


const tcpStream = new TcpStreamHandler({
    host: addr.host,
    port: addr.port,
    token: new Buffer(0),
});

sodium.ready.then(() => {
    run();
});

function run() {
    const serverControl = new ServerControl(secretKey);

    serverControl.on(Connected, (_) => {
        serverControl.createMatch(publicKey).then((e) => {
            runMatch(e.matchUuid);
            serverControl.disconnect();
        });
    });


    tcpStream.onConnect.one(() => {
        serverControl.connect(tcpStream);
    });

    tcpStream.connect();
}

function runMatch(matchUuid: Uint8Array) {
    const match = new PwMatch(
        { matchUuid, secretKey },
        new Logger(0, logStream)
    );
    
    const clients = {};
    const waiting_for = new Set();
    
    match.client.on(Connected, (_) => {
        players.forEach((player, idx) => {
            match.createClient(publicKey).then(({ clientId }) => {
                const clientParams = {
                    clientId: clientId,
                    matchUuid,
                    botConfig: simpleBot,
                    logSink: logStream,
                    secretKey,
                };

                const client = new PwClient(clientParams);
                clients[clientId] = client;
                waiting_for.add(clientId);
                client.run(tcpStream);
    
            });
        })
    });
    
    // print all events that happen on the match reactor
    Object.keys(events).forEach((eventName) => {
        match.on(events[eventName]).subscribe((event) => {
            console.log(event);
        });
    });
    
    
    // MATCH LOGIC
    
    match.on(ClientConnected).subscribe(({ clientId }) => {
        waiting_for.delete(clientId);
        if (waiting_for.size == 0) {
            match.send(StartGame.create(gameConfig));
        }
    });
    
    match.on(ClientDisconnected).subscribe(({ clientId }) => {
        waiting_for.add(clientId);
    });

    match.connect(tcpStream);
}