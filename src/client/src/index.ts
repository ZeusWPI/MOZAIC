import * as Promise from 'bluebird';
import { Address, Connection } from './connection';

let addr = new Address("127.0.0.1", 9142);
let sock = Promise.resolve(addr.connect())
    .then(socket => {
        return new Connection(socket, Buffer.from("01", 'hex'));
    })
    .catch(e => console.log(`error: ${e}`));
//console.log(sock);
console.log('ok ');
//new Connection("127.0.0.1", 9142, Buffer.from("01", "hex"));