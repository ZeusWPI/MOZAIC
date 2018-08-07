import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';
import { WireEvent } from '../networking/EventWire';

export interface EventType<T> {
    new(): T,
}

// // Allows subscribing to individual MOZAIC events through an EventEmitter-based
// // interface.
export class SimpleEventEmitter {
    private handlers: { [typeId: number]: SimpleEventHandler<any> };

    constructor() {
        this.handlers = {};
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        let typeId = (eventType as any).typeId;
        if (!typeId) {
            throw new Error("not a valid event type");
        }
        let handler = this.handlers[typeId];
        if (!handler) {
            handler = new SimpleEventHandler(eventType);
            this.handlers[typeId] = handler;    
        }
        return handler.asSimpleEvent();
    }

    handleAsync(event: any) {
        const handler = this.handlers[event.constructor.typeId];
        if (handler) {
            handler.handleAsync(event);
        }
    }

    handleEvent(event: any) {
        const handler = this.handlers[event.constructor.typeId];
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
    public readonly eventType;
    private dispatcher = new SimpleEventDispatcher<T>();

    constructor(eventType) {
        this.eventType = eventType;
    }

    handleEvent(event) {
        this.dispatcher.dispatch(event);
    }

    handleAsync(event) {
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