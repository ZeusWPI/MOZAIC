import { SimpleEventEmitter, Event, EventType } from "./SimpleEventEmitter";
import { EventHandler } from "../networking/Client";
import { WireEvent } from "../networking/EventWire";
import { ISimpleEvent } from "ste-simple-events";


export interface HasRequestId {
    requestId: number;
}

// TODO: maybe this could use a better name
export class ResponseEmitter implements EventHandler {
    emitter: SimpleEventEmitter;
    resolvers: { [typeId: number]: ResponseResolver<any> };

    constructor() {
        this.emitter = new SimpleEventEmitter();
        this.resolvers = {};
    }

    handleEvent(event: Event) {
        this.emitter.handleEvent(event);
    }

    handleWireEvent(wireEvent: WireEvent) {
        this.emitter.handleWireEvent(wireEvent);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.emitter.on(eventType);
    }

    public resolver<T extends Event & HasRequestId>(
        eventType: EventType<T>
    ): ResponseResolver<T>
    {
        let resolver = this.resolvers[eventType.typeId];
        if (!resolver) {
            resolver = new ResponseResolver();
            this.resolvers[eventType.typeId] = resolver;
            this.emitter.on(eventType).subscribe((e) => resolver.resolve(e));
        }
        return resolver;
    }


}

export class ResponseResolver<E extends Event & HasRequestId> {
    callbacks: {[requestId: number]: (E) => void};

    constructor() {
        this.callbacks = {};
    }

    public resolve(event: E) {
        const handler = this.callbacks[event.requestId];
        if (handler) {
            handler(event);
            delete this.callbacks[event.requestId];
        }
    }

    public responseFor(requestId: number): Promise<E> {
        return new Promise((resolve) => {
            this.callbacks[requestId] = resolve;
        });
    }
}