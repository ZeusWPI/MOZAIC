import * as Promise from 'bluebird';
import { Address, Connection } from './connection';
import { BotRunner, BotConfig } from './BotRunner';

let addr = new Address("127.0.0.1", 9142);

const simpleBot: BotConfig = {
    command: "python3",
    args: ["../games/planetwars/bots/simplebot/simple.py"],
}

for (let i = 1; i <= 2; i++) {
    let conn = new Connection(Buffer.from([i]));

    let botRunner = new BotRunner(simpleBot);
    botRunner.on('message', (message: string) => {
        conn.sendMessage(Buffer.from(message, 'utf-8'));
    })
    botRunner.run();
    
    conn.on('connected', () => {
        console.log(`${i} connected`);
    });

    conn.on('message', (msg: Buffer) => {
        conn.sendMessage(Buffer.from('{"moves": []"}', 'utf-8'));
        botRunner.sendMessage(msg);
    });

    conn.on('close', () => {
        botRunner.killBot();
    })
    
    Promise.resolve(addr.connect())
        .then(socket => conn.connect(socket))
        .catch(e => console.log(`error: ${e}`));
}