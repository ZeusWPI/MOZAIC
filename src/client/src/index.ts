import * as Promise from 'bluebird';
import { Address, Connection } from './connection';

let addr = new Address("127.0.0.1", 9142);

for (let i = 1; i <= 2; i++) {
    let conn = new Connection(Buffer.from([i]));
    
    conn.on('connected', () => {
        console.log(`${i} connected`);
    });
    conn.on('message', (msg: Buffer) => {
        console.log(msg.toString('utf-8'));
        conn.send(Buffer.from('{"moves": []}', 'utf-8'));
    });
    
    Promise.resolve(addr.connect())
        .then(socket => conn.connect(socket))
        .catch(e => console.log(`error: ${e}`));
}