import { Address } from './networking/EventWire';
import { BotConfig } from './planetwars/BotRunner';
import { PwClient } from './planetwars/PwClient';
import { SimpleEventEmitter } from './reactors/SimpleEventEmitter';
import { RegisterClient, Connected, ClientConnected, ClientDisconnected, StartGame } from './events';
import * as events from './events';
import { ServerRunner, ServerParams } from './planetwars/ServerRunner';
import { Reactor } from './reactors/Reactor';
import { Client } from './networking/Client';
import { PwMatch } from './planetwars/PwMatch';
import { createWriteStream } from 'fs';
import { Logger } from './Logger';

const EVENT_TYPES = require('./event_types');

const tokens = ["aaaa", "bbbb"];

const addr: Address = {
    host: "127.0.0.1",
    port: 9142
};

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../planetwars/bots/simplebot/simple.py"],
}

const bin_path = "../gameserver/target/debug/mozaic_bot_driver";

const players = [
    {
        name: 'timp',
        token: "aaaa",
        botConfig: simpleBot,
        number: 1,
    },
    {
        name: 'bert',
        token: "bbbb",
        botConfig: simpleBot,
        number: 2,
    }
];

const gameConfig = {
    mapPath: "../planetwars/maps/hex.json",
    maxTurns: 100,
}

const params: ServerParams = {
    ctrl_token: "abba",

    address: addr,
    logFile: "log.json",
}

const logStream = createWriteStream('log.out');

const runner = new ServerRunner(bin_path, params);
runner.runServer();

const match = new PwMatch({
    host: addr.host,
    port: addr.port,
    token: Buffer.from(params.ctrl_token, 'hex'),
}, new Logger(0, logStream));

const clients = {};
const waiting_for = new Set();

match.on(Connected).subscribe((_) => {
    players.forEach((player, idx) => {
        const player_num = idx + 1;
        match.dispatch(RegisterClient.create({
            clientId: player_num,
            token: Buffer.from(player.token, 'utf-8'),
        }));
        waiting_for.add(player_num);
    })
});

// TODO: this should be done in a more general way
// print all received match events, and forward them to the matchReactor
Object.keys(events).forEach((eventName) => {
    match.on(events[eventName]).subscribe((event) => {
        console.log(event);
        match.dispatch(event);
    });
});




// MATCH LOGIC

match.on(RegisterClient).subscribe((data) => {
    if (!clients[data.clientId]) {
        const client = new PwClient({
            clientId: data.clientId,
            host: addr.host,
            port: addr.port,
            token: data.token,
            botConfig: simpleBot,
            logSink: logStream,
        });
        clients[data.clientId] = client;
        client.run();
    }
});

match.on(ClientConnected).subscribe(({ clientId }) => {
    waiting_for.delete(clientId);
    if (waiting_for.size == 0) {
        match.dispatch(StartGame.create(gameConfig));
    }
});

match.on(ClientDisconnected).subscribe(({ clientId }) => {
    waiting_for.add(clientId);
})

// use a timeout to make sure that the match is running
setTimeout(() => {
    match.connect();
}, 100);