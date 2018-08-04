import { SimpleEventEmitter, EventType } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { EventWire, ClientParams } from './networking/EventWire';
import { Connected, Disconnected } from "./events";


export class MatchReactor {
    private eventWire: EventWire;
    private core: SimpleEventEmitter;

    constructor(clientParams: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventWire = new EventWire(clientParams);

        this.eventWire.onEvent.subscribe((wireEvent) => {
            this.core.handleWireEvent(wireEvent);
        });

        this.eventWire.onConnect.subscribe((_) => {
            this.core.handleEvent(Connected.create({}));
        })

        this.eventWire.onDisconnect.subscribe(() => {
            this.core.handleEvent(Disconnected.create({}));
        })
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }

    public connect() {
        this.eventWire.connect();
    }

    public dispatch(event: any) {
        this.eventWire.send(event);
    }
}