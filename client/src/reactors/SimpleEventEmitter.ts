import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';
import { WireEvent } from '../networking/EventWire';
import * as protobufjs from 'protobufjs';

export interface EventType<T> {
    new(): T,
    typeId: number;
    encode(T): protobufjs.Writer,
    decode(Uint8Array): T,
}

export interface Event {
    eventType: EventType<this>;
}

// // Allows subscribing to individual MOZAIC events through an EventEmitter-based
// // interface.
export class SimpleEventEmitter {
    private handlers: { [typeId: number]: SimpleEventHandler<any> };

    constructor() {
        this.handlers = {};
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        let handler = this.handlers[eventType.typeId];
        if (!handler) {
            handler = new SimpleEventHandler(eventType);
            this.handlers[eventType.typeId] = handler;    
        }
        return handler.asSimpleEvent();
    }

    handleAsync(event: Event) {
        const handler = this.handlers[event.eventType.typeId];
        if (handler) {
            handler.handleAsync(event);
        }
    }

    handleEvent(event: Event) {
        const handler = this.handlers[event.eventType.typeId];
        if (handler) {
            handler.handleEvent(event);
        }
    }

    handleWireEvent(event: WireEvent) {
        const handler = this.handlers[event.typeId];
        if (handler) {
            handler.handleWireEvent(event.data);
        }
    }
}

class SimpleEventHandler<T> {
    public readonly eventType: EventType<T>;
    private dispatcher = new SimpleEventDispatcher<T>();

    constructor(eventType: EventType<T>) {
        this.eventType = eventType;
    }

    handleEvent(event: T) {
        this.dispatcher.dispatch(event);
    }

    handleAsync(event: T) {
        this.dispatcher.dispatchAsync(event);
    }

    handleWireEvent(data: Uint8Array) {
        let event = this.eventType.decode(data);
        this.dispatcher.dispatch(event);
    }

    public asSimpleEvent() {
        return this.dispatcher.asEvent();
    }
}