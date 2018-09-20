import { EventType, Event } from "./SimpleEventEmitter";
import { WireEvent } from "../networking/EventWire";

export class RequestHandler {
    private handlers: { [typeId: number]: SimpleRequestHandler<any> };

    constructor() {
        this.handlers = {};
    }

    public on<T>(eventType: EventType<T>, handler: Handler<T>) {
        const requestHandler = new SimpleRequestHandler(eventType, handler);
        this.handlers[eventType.typeId] = requestHandler;
    }

    public handleEvent(event: Event): Event | void {
        const handler = this.handlers[event.eventType.typeId];
        if (handler) {
            return handler.handleEvent(event);
        }
    }

    public handleWireEvent(wireEvent: WireEvent): Event | void {
        const handler = this.handlers[wireEvent.typeId];
        if (handler) {
            return handler.handleWireEvent(wireEvent.data);
        }
    }

}

export type Handler<T> = (event: T) => Event | void;

class SimpleRequestHandler<T> {
    private eventType: EventType<T>;
    private handler: Handler<T>;

    constructor(eventType: EventType<T>, handler: Handler<T>) {
        this.eventType = eventType;
        this.handler = handler;
    }

    public handleEvent(event: T): Event | void {
        return this.handler(event);
    }

    public handleWireEvent(data: Uint8Array): Event | void {
        const event = this.eventType.decode(data);
        return this.handleEvent(event);
    }
}