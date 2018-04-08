import * as Promise from 'bluebird';
import { Address, Connection } from './connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client } from './Client';

let addr = new Address("127.0.0.1", 9142);

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../games/planetwars/bots/simplebot/simple.py"],
}

for (let i = 1; i <= 2; i++) {
    let connData = {
        token: Buffer.from([i]),
        address: addr,
    };
    let client = new Client(connData, simpleBot);
    client.run();
}