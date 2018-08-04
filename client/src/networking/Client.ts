import { EventWire, ClientParams } from "./EventWire";
import { SimpleEventEmitter, EventType } from "../SimpleEventEmitter";
import { ISimpleEvent } from "ste-simple-events";
import { Connected, Disconnected } from "../events";

export interface EventHandler {
    handleEvent: (any) => void;
    handleWireEvent: (WireEvent) => void;
}

export class Client {
    private eventWire: EventWire;
    public handler: EventHandler;

    constructor(params: ClientParams, handler: EventHandler) {
        this.handler = handler;
        this.eventWire = new EventWire(params);

        this.eventWire.onEvent.subscribe((event) => {
            this.handler.handleWireEvent(event);
        });

        this.eventWire.onConnect.subscribe((_) => {
            this.handler.handleEvent(Connected.create({}));
        });

        this.eventWire.onDisconnect.subscribe(() => {
            this.handler.handleEvent(Disconnected.create({}));
        });
    }

    public connect() {
        this.eventWire.connect();
    }

    public exit() {
        this.eventWire.close();
    }

    public send(event: any) {
        this.eventWire.send(event);
     }
}