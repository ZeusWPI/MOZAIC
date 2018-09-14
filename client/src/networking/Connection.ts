import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { RequestHandler, Handler } from '../reactors/RequestHandler';
import { EventType, Event } from '../reactors/SimpleEventEmitter';
import { Disconnected, Connected } from '../eventTypes';
import { Transport } from './Transport';
import { SignalDispatcher, ISignal } from 'ste-signals';

export type Payload = {
    request?: proto.IRequest,
    response?: proto.IResponse,
    closeRequest?: proto.ICloseRequest,
}

enum ConnectionStatus {
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
    private status: ConnectionStatus;

    private buffer: Payload[];

    private numFlushed: number;
    private numReceived: number;

    private requestHandler: RequestHandler;
    private responseHandlers: { [seq_num: number]: ResponseHandler<any>};

    private transport?: Transport;

    private _onClose = new SignalDispatcher();

    constructor() {
        this.status = ConnectionStatus.OPEN;
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
        this.transport = transport;
        this.transport.onFinish.one(() => {
            if (this.isFinished()) {
                this._onClose.dispatch();
            }
        });
        this.requestHandler.handleEvent(Connected.create());
    }

    public disconnect() {
        this.requestHandler.handleEvent(Disconnected.create());
        this.transport = undefined;
    }

    public isFinished(): boolean {
        return this.status == ConnectionStatus.CLOSED
            && this.buffer.length == 0;
    }

    public requestClose() {
        switch (this.status) {
            case ConnectionStatus.OPEN: {
                this.sendPayload({ closeRequest: {} });
                this.status = ConnectionStatus.REQUESTING_CLOSE;
                break;
            }
            case ConnectionStatus.REMOTE_REQUESTING_CLOSE: {
                this.sendPayload({ closeRequest: {} });
                this.status = ConnectionStatus.CLOSED;
                break;
            }
            default: {
                throw new Error("called requestClose in illegal state");
            }
        }
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

    public get seqNum() {
        return this.numFlushed + this.buffer.length;
    }

    public get ackNum() {
        return this.numReceived;
    }

    public getBufferedPacket(seqNum: number): Payload {
        return this.buffer[seqNum - this.numFlushed - 1];
    }

    public handlePacket(packet: proto.Packet) {
        if (packet.seqNum < this.numReceived) {
            console.error("got retransmitted packet");
            return;
        }
        if (packet.seqNum > this.numReceived + 1) {
            console.error("got out of order packet");
            return;
        }

        this.numReceived = packet.seqNum;
        let ackNum = packet.ackNum;

        if (ackNum > this.seqNum) {
            ackNum = this.seqNum;
        }

        if (ackNum > this.numFlushed) {
            console.log(`flushing ${ackNum - this.numFlushed} packets`);
            this.buffer.splice(0, ackNum - this.numFlushed);
            this.numFlushed = ackNum;
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
        } else if (packet.closeRequest) {
            switch (this.status) {
                case ConnectionStatus.OPEN: {
                    this.status = ConnectionStatus.REMOTE_REQUESTING_CLOSE;
                    // TODO: implement the option to keep the connection open
                    this.requestClose();
                    break;
                }
                case ConnectionStatus.REQUESTING_CLOSE: {
                    this.status = ConnectionStatus.CLOSED;
                    break;
                }
                default: {
                    throw new Error("illegal close received")
                }
            }
        }
    }

    public get onClose(): ISignal {
        return this._onClose.asEvent();
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