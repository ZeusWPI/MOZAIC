import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { RequestHandler, Handler } from '../reactors/RequestHandler';
import { EventType, Event } from '../reactors/SimpleEventEmitter';
import { Transport } from './Transport';
import { Disconnected, Connected } from '../eventTypes';

export type Payload = {
    request?: proto.IRequest,
    response?: proto.IResponse,
    closeConnection?: proto.ICloseConnection,
}

enum ConnectionState {
    // operating normally
    OPEN,
    // we are requesting to close the connection
    REQUESTING_CLOSE,
    // remote party is requesting to close the connection
    REMOTE_REQUESTING_CLOSE,
    // the connection has been closed
    CLOSED,
}

export class Connection {
    private state: ConnectionState;

    private buffer: Payload[];

    private numFlushed: number;
    private numReceived: number;

    private requestHandler: RequestHandler;
    private responseHandlers: { [seq_num: number]: ResponseHandler<any>};

    private transport?: Transport;

    constructor() {
        this.state = ConnectionState.OPEN;
        this.buffer = [];
        this.numFlushed = 0;
        this.numReceived = 0;

        this.requestHandler = new RequestHandler();
        this.responseHandlers = {};
    }

    sendPayload(payload: Payload): number {
        this.buffer.push(payload);
        const seqNum = this.numFlushed + this.buffer.length;
        if (this.transport) {
            this.transport.send(proto.Packet.create({
                seqNum,
                ackNum: this.numReceived,
                ...payload,
            }));
        }
        return seqNum;
    }

    public connect(transport: Transport) {
        console.log('connected');
        this.transport = transport;
        this.requestHandler.handleEvent(Connected.create());
    }

    public disconnect() {
        this.requestHandler.handleEvent(Disconnected.create());
        this.transport = undefined;
    }

    public isFinished(): boolean {
        return this.buffer.length == 0;
    }

    public requestClose() {
        const closeConnection = proto.CloseConnection.create({});
        this.sendPayload({ closeConnection });
    }

    public request(request: proto.IRequest);
    public request<T>(request: proto.IRequest, responseType: EventType<T>) : Promise<T>;
    public request<T>(request: proto.IRequest, responseType?: EventType<T>): Promise<T> | void
    {
        const seqNum = this.sendPayload({ request: request });
        if (responseType) {
            return new Promise((resolve, reject) => {
                this.responseHandlers[seqNum] = new ResponseHandler(
                    responseType,
                    resolve,
                    reject,
                );
            })
        }
    }

    public on<T>(eventType: EventType<T>, handler: Handler<T>) {
        this.requestHandler.on(eventType, handler);
    }

    handlePacket(packet: proto.Packet) {
        this.numReceived = packet.seqNum;

        if (packet.ackNum > this.numFlushed) {
            console.log(`flushing ${packet.ackNum - this.numFlushed} packets`);
            this.buffer.splice(0, packet.ackNum - this.numFlushed);
            this.numFlushed = packet.ackNum;
        }
        console.log(`buffer has ${this.buffer.length} items`);

        
        if (packet.request) {
            // these values should be present according to protobuf3 spec
            const requestSeqNum = packet.seqNum!;
            const typeId = packet.request.typeId!;
            const data = packet.request.data!;

            const responseEvent = this.requestHandler.handleWireEvent({
                typeId,
                data
            });

            let response: proto.IResponse;
            if (responseEvent) {
                response = {
                    requestSeqNum,
                    typeId: responseEvent.eventType.typeId,
                    data: responseEvent.eventType.encode(responseEvent).finish(),
                };
            } else {
                // send back an empty event
                response = { requestSeqNum };
            }
            this.sendPayload({ response });
        } else if (packet.response) {
            const seqNum = packet.response.requestSeqNum!;
            const handler = this.responseHandlers[seqNum];
            if (handler) {
                handler.handleResponse(packet.response);
                delete this.responseHandlers[seqNum];
            }
        } else if (packet.closeConnection) {
            switch (this.state) {
                case ConnectionState.OPEN: {
                    // TODO: implement the option to keep the connection open
                    const closeConnection = proto.CloseConnection.create({});
                    this.sendPayload({ closeConnection });
                    this.state = ConnectionState.CLOSED;
                    break;
                }
                case ConnectionState.REQUESTING_CLOSE: {
                    this.state = ConnectionState.CLOSED;
                    break;
                }
                default: {
                    throw new Error("illegal close received")
                }
            }
        }

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