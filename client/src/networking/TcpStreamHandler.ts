import { ProtobufStream } from "./ProtobufStream";
import { ClientParams } from "./EventWire";
import { Connection } from "./Connection";

import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { SignalDispatcher, ISignal } from "ste-signals";
import { SimpleEventDispatcher, ISimpleEvent } from "ste-simple-events";
import { Transport } from "./Transport";





export class TcpStreamHandler {
    private stream: ProtobufStream;
    private channels: { [channelNum: number]: Transport };
    private params: ClientParams;
    private channelCounter = 0;

    // whether to keep the connection open when all channels have been closed.
    private keepAlive: boolean;
    private numChannels: number;

    private _onDisconnect = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();
    private _onClose = new SignalDispatcher();


    // TODO: dont use clientparams
    constructor(params: ClientParams) {
        this.channels = {};
        this.stream = new ProtobufStream();

        this.params = params;
        // TODO: set this to true maybe?
        this.keepAlive = false;
        this.numChannels = 0;

        this.stream.onMessage.subscribe((data) => {
            const frame = proto.Frame.decode(data);
            const transport = this.channels[frame.channelNum];
            if (transport) {
                transport.handleMessage(frame.data);
            } else {
                console.log('message has no channel');
            }
        });
    }

    public openChannel(message: Uint8Array, connection: Connection) {
        const channel = new Transport(this, this.channelCounter, connection);
        this.channels[this.channelCounter] = channel;
        this.channelCounter += 1;
        this.numChannels += 1;
        channel.connect(message);
    }

    public closeChannel(channelNum: number) {
        delete this.channels[channelNum];
        this.numChannels -= 1;
        if (this.numChannels == 0 && !this.keepAlive) {
            this.stream.end();
        }
    }

    public sendFrame(frame: proto.IFrame) {
        this.stream.write(proto.Frame.encode(frame));
        console.log('sent frame');
    }

    public connect() {
        this.stream.connect(this.params.host, this.params.port);
        this.stream.onClose.one(() => {
            console.log('disconnect');
        });
    }
        

    public get onConnect() {
        return this.stream.onConnect;
    }

    public get onDisconnect() {
        return this._onDisconnect.asEvent();
    }
        
    public get onError() {
        return this._onError.asEvent();
    }
    
    public get onClose() {
        return this._onClose.asEvent();
    }

    public exit() {
        this.stream.end();
    }
}