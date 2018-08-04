import { SimpleEventEmitter, EventType } from "./SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";

export class Reactor {
    private eventEmitter: SimpleEventEmitter;

    constructor() {
        this.eventEmitter = new SimpleEventEmitter();
    }

    public dispatch(event: any) {
        this.eventEmitter.handleEvent(event);
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.eventEmitter.on(eventType);
    }
}