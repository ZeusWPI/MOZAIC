import { EventWire } from "./EventWire";
import { ClientParams } from "./EventWire";
import { SimpleEventEmitter, EventType } from "./reactor";
import { ISimpleEvent } from "ste-simple-events";
import { Connected, Disconnected } from "./events";

export class ClientReactor {
    eventWire: EventWire;
    private core: SimpleEventEmitter;

    constructor(params: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventWire = new EventWire(params);

        this.eventWire.onEvent.subscribe((event) => {
            this.core.handleWireEvent(event);
        });

        this.eventWire.onConnect.subscribe((_) => {
            this.core.handleEvent(Connected.create({}));
        });

        this.eventWire.onDisconnect.subscribe(() => {
            this.core.handleEvent(Disconnected.create({}));
        });
    }

    public connect() {
        this.eventWire.connect();
    }

    public exit() {
        this.eventWire.close();
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }
''
    public dispatch(event: any) {
        this.core.handleEvent(event);
        this.eventWire.send(event);
     }
}