import { Address, EventWire } from './networking/EventWire';
import { BotConfig } from './planetwars/BotRunner';
import { PwClient } from './planetwars/PwClient';
import { Connected, ClientConnected, ClientDisconnected, StartGame } from './eventTypes';
import * as events from './eventTypes';
import { PwMatch } from './planetwars/PwMatch';
import { createWriteStream } from 'fs';
import { Logger } from './Logger';
import * as crypto from 'crypto';
import { ServerControl } from './ServerControl';

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
        token: crypto.randomBytes(16).toString('hex'),
        botConfig: simpleBot,
        number: 1,
    },
    {
        name: 'bert',
        token: crypto.randomBytes(16).toString('hex'),
        botConfig: simpleBot,
        number: 2,
    }
];

const gameConfig = {
    mapPath: "../planetwars/maps/hex.json",
    maxTurns: 100,
}

const logStream = createWriteStream('log.out');

const ownerToken = Buffer.from('cccc', 'hex');

function runMatch(matchUuid: Uint8Array) {
    const match = new PwMatch({
        host: addr.host,
        port: addr.port,
        token: ownerToken,
        matchUuid,
    }, new Logger(0, logStream));
    
    const clients = {};
    const waiting_for = new Set();
    
    match.client.on(Connected, (_) => {
        players.forEach((player, idx) => {
            const player_num = idx + 1;
            waiting_for.add(player_num);
            const token = Buffer.from(player.token, 'utf-8');
            match.createClient(token).then(({ clientId }) => {
                const client = new PwClient({
                    clientId: clientId,
                    token,
                    matchUuid,
                    host: addr.host,
                    port: addr.port,
                    botConfig: simpleBot,
                    logSink: logStream,
                });
                clients[clientId] = client;
                client.run();
    
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

    match.connect();
}

const serverControl = new ServerControl({
    ...addr,
    token: Buffer.from('abba', 'hex'),
});

serverControl.on(Connected, (_) => {
    serverControl.createMatch(ownerToken).then((e) => {
        runMatch(e.matchUuid);
        serverControl.disconnect();
    });
});

serverControl.connect();
