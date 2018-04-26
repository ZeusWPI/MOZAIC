import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client } from './Client';

const tokens = ["aaaa", "bbbb"];

const addr: Address = {
    host: "127.0.0.1",
    port: 9142
};

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../planetwars/bots/simplebot/simple.py"],
}

for (let i = 0; i < 2; i++) {
    let connData = {
        token: Buffer.from(tokens[i], 'hex'),
        address: addr,
    };
    let client = new Client(connData, simpleBot);
    client.run();
}