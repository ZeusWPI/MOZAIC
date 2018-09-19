import { EventWire, ClientParams } from "./EventWire";
import { Connected, Disconnected } from "../eventTypes";
import { Event, EventType } from "../reactors/SimpleEventEmitter";
import { RequestHandler, Handler } from "../reactors/RequestHandler";

export interface EventHandler {
    handleEvent: (any) => void;
    handleWireEvent: (WireEvent) => void;
}

export class Client {
    private eventWire: EventWire;
    public handler: RequestHandler;

    constructor(params: ClientParams) {
        this.handler = new RequestHandler;
        this.eventWire = new EventWire(params, this.handler);

        this.eventWire.onConnect.subscribe((_) => {
            this.handler.handleEvent(Connected.create({}));
        });

        this.eventWire.onDisconnect.subscribe(() => {
            this.handler.handleEvent(Disconnected.create({}));
        });
    }

    public on<T>(eventType: EventType<T>, handler: Handler<T>) {
        this.handler.on(eventType, handler);
    }

    public connect(message: Uint8Array) {
        this.eventWire.connect(message);
    }

    public exit() {
        this.eventWire.close();
    }

    public send(event: Event) {
        this.eventWire.send(event);
    }

    public request<T>(event: Event, responseType: EventType<T>): Promise<T> {
        return this.eventWire.request(event, responseType);
    }
}