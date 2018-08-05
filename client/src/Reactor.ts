import { SimpleEventEmitter, EventType } from "./SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { EventHandler } from "./networking/Client";
import { WireEvent } from "./networking/EventWire";

export class Reactor implements EventHandler {
    private eventEmitter: SimpleEventEmitter;

    constructor() {
        this.eventEmitter = new SimpleEventEmitter();
    }

    public dispatch(event: any) {
        this.handleEvent(event);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.eventEmitter.on(eventType);
    }

    public handleEvent(event: any) {
        this.eventEmitter.handleEvent(event);
    }

    public handleWireEvent(event: WireEvent) {
        this.eventEmitter.handleWireEvent(event);
    }
}