import * as protocol_root from './proto';
const proto = protocol_root.mozaic.protocol;
import * as net from 'net';
import * as Promise from 'bluebird';



export class Address {
    readonly host: string;
    readonly port: number;

    public constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    public connect() : Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            let socket = net.connect({
                host: this.host,
                port: this.port,
            });

            socket.on('connect', () => resolve(socket));
            socket.on('error', e => reject(e));
        });
    }
}


export function connect(socket: net.Socket, token: Buffer) : Promise<Connection> {
    return new Promise((resolve, reject) => {
        let request = proto.ConnectRequest.create({ token: token });
        let bytes = proto.ConnectRequest.encodeDelimited(request).finish();
        socket.write(bytes);
        socket.on('error', e => reject(e));
        socket.on('data', buf => {
            let response = proto.ConnectResponse.decodeDelimited(buf);
            if (response.error) {
                // TODO: should this be wrapped or something?
                reject(response.error);
            } else {
                resolve(new Connection(socket));
            }
        });
    });
}


export class Connection {
    private socket: net.Socket;
    
    public constructor(socket: net.Socket) {
        this.socket = socket;
    }
}