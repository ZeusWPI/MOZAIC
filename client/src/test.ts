import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { PwClient } from './PwClient';
import { MatchReactor } from './MatchReactor';
import { SimpleEventEmitter } from './reactor';
import { RegisterClient, FollowerConnected, LeaderConnected, ClientConnected, ClientDisconnected, StartGame } from './events';
import { ClientReactor } from './ClientReactor';
import * as events from './events';
import { ServerRunner, ServerParams } from './ServerRunner';

const EVENT_TYPES = require('./event_types');

// console.log(EVENT_TYPES);
// var evt = ClientConnected.create({ clientId: 1 });
// console.log((evt.constructor as any).typeId);
// console.log(evt);

var emitter = new SimpleEventEmitter();
emitter.on(ClientConnected).subscribe((e) => {
    console.log('HEY IK HEB EEN EVENT');
    console.log(e);
});
emitter.handleEvent(ClientConnected.create({
    clientId: 1
}));

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

const runner = new ServerRunner(bin_path, params);
runner.runServer()

const clients = {};
const waiting_for = new Set();

const clientParams = {
    host: addr.host,
    port: addr.port,
    token: Buffer.from(params.ctrl_token, 'hex'),
}
const matchReactor = new MatchReactor(clientParams);

Object.keys(events).forEach((eventName) => {
    matchReactor.on(events[eventName]).subscribe((event) => {
        console.log(`${eventName}: ${JSON.stringify(event)}`);
    });
});


matchReactor.on(FollowerConnected).subscribe((_) => {
    players.forEach((player, idx) => {
        const player_num = idx + 1;
        matchReactor.dispatch(RegisterClient.create({
            clientId: player_num,
            token: Buffer.from(player.token, 'utf-8'),
        }));
        waiting_for.add(player_num);
    })
});

matchReactor.on(RegisterClient).subscribe((data) => {
    if (!clients[data.clientId]) {
        const client = new PwClient({
            clientId: data.clientId,
            host: addr.host,
            port: addr.port,
            token: data.token,
            botConfig: simpleBot,
        });
        clients[data.clientId] = client;
        client.run();
    }
});

matchReactor.on(ClientConnected).subscribe(({ clientId }) => {
    waiting_for.delete(clientId);
    if (waiting_for.size == 0) {
        matchReactor.dispatch(StartGame.create(gameConfig));
    }
});

matchReactor.on(ClientDisconnected).subscribe(({ clientId }) => {
    waiting_for.add(clientId);
})

matchReactor.connect();