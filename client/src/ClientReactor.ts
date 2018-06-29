import { EventChannel } from "./EventChannel";
import { ClientParams } from "./Connection";
import { SomeEvent, STEReactor, EventType, AnyEvent } from "./reactor";
import { ISimpleEvent } from "ste-simple-events";
import { LeaderConnected, LeaderDisconnected } from "./events";

export class ClientReactor {
    eventChannel: EventChannel;
    private reactor: STEReactor;

    constructor(params: ClientParams) {
        this.reactor = new STEReactor();
        this.eventChannel = new EventChannel(params);

        this.eventChannel.onEvent.subscribe((event) => {
            event.handle(this.reactor);
        });

        this.eventChannel.onConnect.subscribe((_) => {
            this.reactor.handleEvent(LeaderConnected.create({}));
        });

        this.eventChannel.onDisconnect.subscribe(() => {
            this.reactor.handleEvent(LeaderDisconnected.create({}));
        });
    }

    public connect() {
        this.eventChannel.connect();
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public dispatch(event: AnyEvent) {
        this.reactor.handleEvent(event);
        this.eventChannel.dispatch(event);
     }
}