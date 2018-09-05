import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;

import {
    SimpleEventDispatcher,
    SignalDispatcher,
    ISignal,
    ISimpleEvent
} from 'strongly-typed-events';

import { ProtobufStream } from './ProtobufStream';
import { execFileSync } from 'child_process';
import { encodeEvent } from '../reactors/utils';
import { Event, EventType } from '../reactors/SimpleEventEmitter';
import { RequestHandler } from '../reactors/RequestHandler';

export interface Address {
    host: string;
    port: number;
}

export interface ClientParams {
    host: string;
    port: number;
    token: Uint8Array;
}

enum ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    CLOSED,
};

export interface WireEvent {
    typeId: number,
    data: Uint8Array,
}

export class EventWire {
    private state: ConnectionState;
    private stream: ProtobufStream;
    private seqNum: number;

    private responseHandlers: { [seq_num: number]: ResponseHandler<any>};

    private params: ClientParams;

    private _onConnect = new SignalDispatcher();
    private _onDisconnect = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();
    private _onClose = new SignalDispatcher();

    private requestHandler: RequestHandler;
    
    public constructor(params: ClientParams, handler: RequestHandler) {
        this.state = ConnectionState.DISCONNECTED;
        this.stream = new ProtobufStream();
        this.seqNum = 0;
        this.params = params;
        this.requestHandler = handler;

        this.responseHandlers = {};

        this.stream.onClose.subscribe(() => {
            this._onClose.dispatch();
            this._onDisconnect.dispatch();
        });
        this.stream.onMessage.subscribe((data) => {
            this.handleMessage(data);
        })
    }

    public get onConnect() {
        return this._onConnect.asEvent();
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
    
    public connect(message: Uint8Array) {
        this.state = ConnectionState.CONNECTING;
        this.stream.connect(this.params.host, this.params.port);

        this.stream.onConnect.one(() => {
            this.sendConnectionRequest(message);
        });


        // Introduced in version 9.0.0, node.js has a strict politeness policy.
        // Needless to say, it would be really rude to just connect to somebody
        // without ever greeting them.
        // Therefore, we greet the user when connecting so that we are certain
        // that he has been properly greeted when establishing a connection.
        const user = execFileSync('whoami');
        console.log(`hello ${user.toString('utf-8')}`);
        
    }

    public close() {
        // TODO: implement this in a more reliable way
        // i.e. don't just leave
        this.stream.end();
    }

    public send(event: Event) {
        const wireEvent = encodeEvent(event);
        this.sendWireEvent(wireEvent);
    }

    public request<T>(event: Event, responseType: EventType<T>): Promise<T> {
        const wireEvent = encodeEvent(event);
        return this.requestWire(wireEvent, responseType);
    }

    public requestWire<T>(wireEvent: WireEvent, responseType: EventType<T>)
        : Promise<T>
    {
        return new Promise((resolve, reject) => {
            const seqNum = this.sendWireEvent(wireEvent);
            const handler = new ResponseHandler(responseType, resolve, reject);
            this.responseHandlers[seqNum] = handler;
        });
    }

    public sendWireEvent(wireEvent: WireEvent): number {
        // TODO: maybe ensure that the connection handshake has completed here
        const seqNum = this.seqNum;
        this.seqNum += 1;

        const { typeId, data } = wireEvent;

        let packet = proto.Packet.create({
            request: { seqNum, typeId, data }
        });
        this.stream.write(proto.Packet.encode(packet));

        return seqNum;
    }

    private handleMessage(data: Uint8Array) {
        switch (this.state) {
            case ConnectionState.CONNECTING: {
                this.handleConnectionResponse(data);
                break;
            }
            case ConnectionState.CONNECTED: {
                this.handlePacket(data);
                break;
            }
        }
    }
    
    // initiate connection handshake
    private sendConnectionRequest(message: Uint8Array) {
        let connRequest = {
            message,
            token: this.params.token,
        };
        this.stream.write(proto.ConnectionRequest.encode(connRequest));
    }

    private handleConnectionResponse(message: Uint8Array) {
        let response = proto.ConnectionResponse.decode(message);
        if (response.success) {
            this.state = ConnectionState.CONNECTED;
            this._onConnect.dispatch();
        } else if (response.error) {
            // TODO: should there be a special error state?
            this.state = ConnectionState.CLOSED;;
            // TODO this is not particulary nice
            const err = new Error(response.error.message!);
            this._onError.dispatch(err);
        }
    }

    private handlePacket(data: Uint8Array) {
        const packet = proto.Packet.decode(data);

        if (packet.request) {
            // these values should be present according to protobuf3 spec
            const seqNum = packet.request.seqNum!;
            const typeId = packet.request.typeId!;
            const data = packet.request.data!;

            const responseEvent = this.requestHandler.handleWireEvent({
                typeId,
                data
            });

            let response: proto.IResponse;
            if (responseEvent) {
                response = {
                    seqNum,
                    typeId: responseEvent.eventType.typeId,
                    data: responseEvent.eventType.encode(responseEvent).finish(),
                };
            } else {
                // send back an empty event
                response = { seqNum };
            }
            this.stream.write(proto.Packet.encode({ response }));
        } else if (packet.response) {
            const seqNum = packet.response.seqNum!;
            const handler = this.responseHandlers[seqNum];
            if (handler) {
                handler.handleResponse(packet.response);
                delete this.responseHandlers[seqNum];
            }
        }
        // TODO: other options
    }
}

export class ResponseHandler<T> {
    private eventType: EventType<T>;
    private resolve: (response: T) => void;
    private reject: (err: Error) => void;

    constructor(
        eventType: EventType<T>,
        resolve: (response: T) => void,
        reject: (err: Error) => void,
    ) {
        this.eventType = eventType;
        this.resolve = resolve;
        this.reject = reject;
    }

    public handleResponse(response: proto.IResponse) {
        const event = this.eventType.decode(response.data);
        this.resolve(event);
    }

    public handleError(err: Error) {
        this.reject(err);
    }
}