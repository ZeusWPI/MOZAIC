import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client } from './Client';
import { MatchParams, MatchRunner } from './MatchRunner';

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

const params: MatchParams = {
    ctrl_token: "abba",
    players: [
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
    ],
    mapFile: "../planetwars/maps/hex.json",
    maxTurns: 100,
    address: addr,
    logFile: "log.json",
}

let runner = new MatchRunner(bin_path, params);
runner.run();