import { SimpleEventEmitter, EventType, Event } from "./SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { EventHandler } from "../networking/Client";
import { WireEvent } from "../networking/EventWire";
import { Logger } from "../Logger";
import { encodeEvent } from "./utils";

export class Reactor implements EventHandler {
    private eventEmitter: SimpleEventEmitter;
    private logger: Logger;

    constructor(logger: Logger) {
        this.eventEmitter = new SimpleEventEmitter();
        this.logger = logger;
    }

    public dispatch(event: Event) {
        const wireEvent = encodeEvent(event);
        this.logger.log(wireEvent);
        this.eventEmitter.handleAsync(event);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.eventEmitter.on(eventType);
    }

    public handleEvent(event: Event) {
        const wireEvent = encodeEvent(event);
        this.logger.log(wireEvent);
        this.eventEmitter.handleEvent(event);
    }

    public handleWireEvent(event: WireEvent) {
        this.logger.log(event);
        this.eventEmitter.handleWireEvent(event);
    }
}
