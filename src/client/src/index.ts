import * as Promise from 'bluebird';
import { Address, Connection } from './connection';

let addr = new Address("127.0.0.1", 9142);
let conn = new Connection(Buffer.from("01", 'hex'));

conn.on('connected', () => {
    console.log('connected');
});
conn.on('message', (msg: Buffer) => {
    console.log(msg.toString('utf-8'));
});

let sock = Promise.resolve(addr.connect())
    .then(socket => conn.connect(socket))
    .catch(e => console.log(`error: ${e}`));
//console.log(sock);
console.log('ok ');
//new Connection("127.0.0.1", 9142, Buffer.from("01", "hex"));