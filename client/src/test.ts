import { Connection, Address } from './Connection';
import { BotRunner, BotConfig } from './BotRunner';
import { Client } from './Client';

const tokens = ["aaaa", "bbbb"];
// const tokens = [
//     "87193832752280671551f904a2034039f78fdc0bd7bec28a8c74779f3db97dac",
//     "932debbb7e44e5a471a4ff326079232f2150703b8f488e3c4adbbf6b61709170"
// ];

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