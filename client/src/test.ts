import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { PwClient } from './PwClient';
import { MatchReactor } from './MatchReactor';
import { RegisterClient, FollowerConnected, LeaderConnected, ClientConnected, ClientDisconnected, StartGame } from './events';
import { ClientReactor } from './ClientReactor';
import * as events from './events';
import { ServerRunner, ServerParams } from './ServerRunner';



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
    "map_path": "../planetwars/maps/hex.json",
    "max_turns": 100,
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
            client_id: player_num,
            token: player.token,
        }));
        waiting_for.add(player_num);
    })
});

matchReactor.on(RegisterClient).subscribe((data) => {
    if (!clients[data.client_id]) {
        const client = new PwClient({
            clientId: data.client_id,
            host: addr.host,
            port: addr.port,
            token: Buffer.from(data.token, 'hex'),
            botConfig: simpleBot,
        });
        clients[data.client_id] = client;
        client.run();
    }
});

matchReactor.on(ClientConnected).subscribe(({ client_id }) => {
    waiting_for.delete(client_id);
    if (waiting_for.size == 0) {
        matchReactor.dispatch(StartGame.create(gameConfig));
    }
});

matchReactor.on(ClientDisconnected).subscribe(({ client_id }) => {
    waiting_for.add(client_id);
})

matchReactor.connect();