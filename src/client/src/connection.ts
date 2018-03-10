import * as protocol from './proto';
import * as net from 'net';

const proto  = protocol.mozaic.protocol;

export class Connection {
    private socket: net.Socket;
    private token: Buffer;
    
    public constructor(host: string, port: number, token: Buffer) {
        this.token = token;

        
        this.socket = net.connect(port, host, () => {
            this.send_message(proto.ConnectRequest, { token: token });
        });
    }

    private send_message(type, params) {
        let msg = type.create(params);
        let bytes = type.encodeDelimited(msg).finish();
        this.socket.write(bytes);
    }
}