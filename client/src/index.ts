import { Connection } from './connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client, Address } from './Client';

let addr: Address = {
    host: "127.0.0.1",
    port: 9142
};

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../planetwars/bots/simplebot/simple.py"],
}

for (let i = 1; i <= 2; i++) {
    let connData = {
        token: Buffer.from([i]),
        address: addr,
    };
    let client = new Client(connData, simpleBot);
    client.run();
}
