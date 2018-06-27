import { TextDecoder } from 'text-encoding';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

export interface EventType<T> {
    typeId: number;
    encode: (T) => Uint8Array;
    decode: (Uint8Array) => T;
}

export interface TypedEvent<T> {
    eventType: EventType<T>,
    data: T,
}

export type AnyEvent = TypedEvent<any>;

export interface WireEvent {
    typeId: number;
    data: Uint8Array;
}

export class JsonEventType<T> {
    public readonly typeId: number;

    constructor(typeId: number) {
        this.typeId = typeId;
    }

    encode(data: T): Uint8Array {
        let json = JSON.stringify(data);
        return Buffer.from(json, 'utf-8');
    }

    decode(data: Uint8Array): T {
        let string = new TextDecoder('utf-8').decode(data);
        return JSON.parse(string);
    }
}


export interface Reactor {
    handleEvent(event: AnyEvent);
    handleWireEvent(event: WireEvent);
}

export class STEReactor {
    private handlers: { [typeId: number]: STEReactorHandler<any> };

    constructor() {
        this.handlers = {};
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        let handler = this.handlers[eventType.typeId];
        if (!handler) {
            handler = new STEReactorHandler(eventType);
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

class STEReactorHandler<T> {
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