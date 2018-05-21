import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client } from './Client';
import { MatchParams, MatchRunner } from './MatchRunner';
import { ClientLogger } from './Logger';



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
    "map_file": "../planetwars/maps/hex.json",
    "max_turns": 100,
}

const params: MatchParams = {
    ctrl_token: "abba",

    address: addr,
    logFile: "log.json",
}

MatchRunner.create(bin_path, params).then((match) => {
    const addPlayers = players.map((player) => {
        const token = Buffer.from(player.token, 'hex');
        return match.addPlayer(token).then((clientId) => {
            console.log(clientId);
            const connData = {
                address: addr,
                token: token,
            };
            const clientLogger = new ClientLogger(match.logger, clientId);
            let client = new Client(connData, player.botConfig, clientLogger);
            client.run();
        });
    });
    Promise.all(addPlayers).then(() => {
        return match.startGame(gameConfig);
    });
});