import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

export interface EventType<T> {
    typeId: number;
    encode: (T) => Uint8Array;
    decode: (Uint8Array) => T;
}

export interface SomeEvent {
    handle: (Reactor) => void;
    toWireEvent: () => WireEvent;
}

export class TypedEvent<T> implements SomeEvent {
    public readonly eventType: EventType<T>;
    public readonly data: T;

    constructor(type: EventType<T>, data: T) {
        this.eventType = type;
        this.data = data;
    }

    public handle(reactor: Reactor) {
        reactor.handleEvent(this);
    }

    public toWireEvent(): WireEvent {
        return new WireEvent(
            this.eventType.typeId,
            this.eventType.encode(this.data),
        );
    }
}

export type AnyEvent = TypedEvent<any>;

export class WireEvent implements SomeEvent {
    public readonly typeId: number;
    public readonly data: Uint8Array;

    constructor(typeId: number, data: Uint8Array) {
        this.typeId = typeId;
        this.data = data;
    }

    public handle(reactor: Reactor) {
        reactor.handleWireEvent(this);
    }

    public toWireEvent(): WireEvent {
        return this;
    }
}

export interface Reactor {
    handleEvent(event: AnyEvent);
    handleWireEvent(event: WireEvent);
}

// Allows subscribing to individual MOZAIC events through an EventEmitter-based
// interface.
export class SimpleEventEmitter implements Reactor {
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

    handleEvent(event: AnyEvent) {
        const handler = this.handlers[event.eventType.typeId];
        if (handler) {
            handler.handleEvent(event.data);
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

    handleWireEvent(data: Uint8Array) {
        let event = this.eventType.decode(data);
        this.dispatcher.dispatch(event);
    }

    public asSimpleEvent() {
        return this.dispatcher.asEvent();
    }
}