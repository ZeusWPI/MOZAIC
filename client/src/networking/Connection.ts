import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;
import { RequestHandler, Handler } from '../reactors/RequestHandler';
import { EventType, Event } from '../reactors/SimpleEventEmitter';
import { Transport } from './Transport';
import { WireEvent } from './EventWire';
import { Disconnected, Connected } from '../eventTypes';

export type Payload = {
    request?: proto.IRequest,
    response?: proto.IResponse,
    closeConnection?: proto.ICloseConnection,
}

export class Connection {
    private buffer: Payload[];
    private seqOffset: number;
    private ackNum: number;

    private requestHandler: RequestHandler;
    private responseHandlers: { [seq_num: number]: ResponseHandler<any>};

    private transport?: Transport;

    constructor() {
        this.buffer = [];
        this.seqOffset = 0;
        this.ackNum = 0;

        this.requestHandler = new RequestHandler();
        this.responseHandlers = {};
    }

    getPayload(seqNum: number) {
        return this.buffer[seqNum - this.seqOffset];
    }

    sendPayload(payload: Payload): number {
        const seqNum = this.seqOffset + this.buffer.length;
        this.buffer.push(payload);
        if (this.transport) {
            this.transport.send(proto.Packet.create({
                seqNum,
                ackNum: this.ackNum,
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
        this.ackNum = packet.seqNum + 1;

        if (packet.ackNum > this.seqOffset) {
            console.log(`flushing ${packet.ackNum - this.seqOffset} packets`);
            this.buffer.splice(0, packet.ackNum - this.seqOffset);
            this.seqOffset = packet.ackNum;
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
            const closeConnection = proto.CloseConnection.create({});
            const packet = proto.Packet.encode({ closeConnection });
            this.sendPayload({ closeConnection });
            // TODO: actually close connection
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