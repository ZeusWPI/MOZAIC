import * as protocol from './proto';
import * as net from 'net';

const proto  = protocol.mozaic.client_server;

function connect() {
    let client = new net.Socket();

    client.connect(9142, '127.0.0.1', function() {
        console.log('connected');
        let msg = proto.Connect.create({
            "token": Buffer.from("1"),
        });
        client.write(proto.Connect.encodeDelimited(msg).finish());
    });

    client.on('data', function(data) {
	    console.log('Received: ' + data);
	    client.destroy()
    });

    client.on('close', function() {
        console.log('Connection closed');
    });
}

connect();