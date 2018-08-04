import { ProtobufStream } from "./ProtobufStream";
import { SimpleEventEmitter, EventType } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { EventWire, ClientParams } from './EventWire';
import { FollowerConnected, FollowerDisconnected } from "./events";


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
            this.core.handleEvent(FollowerConnected.create({}));
        })

        this.eventWire.onDisconnect.subscribe(() => {
            this.core.handleEvent(FollowerDisconnected.create({}));
        })
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }

    public connect() {
        this.eventWire.connect();
    }

    public dispatch(event: any) {
        // TODO
        this.eventWire.send(event);
    }
}