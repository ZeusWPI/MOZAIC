import { EventChannel } from "./EventChannel";
import { ClientParams } from "./Connection";
import { SomeEvent, SimpleEventEmitter, EventType, AnyEvent } from "./reactor";
import { ISimpleEvent } from "ste-simple-events";
import { LeaderConnected, LeaderDisconnected } from "./events";

export class ClientReactor {
    eventChannel: EventChannel;
    private core: SimpleEventEmitter;

    constructor(params: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventChannel = new EventChannel(params);

        this.eventChannel.onEvent.subscribe((event) => {
            event.handle(this.core);
        });

        this.eventChannel.onConnect.subscribe((_) => {
            this.core.handleEvent(LeaderConnected.create({}));
        });

        this.eventChannel.onDisconnect.subscribe(() => {
            this.core.handleEvent(LeaderDisconnected.create({}));
        });
    }

    public connect() {
        this.eventChannel.connect();
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }

    public dispatch(event: AnyEvent) {
        this.core.handleEvent(event);
        this.eventChannel.dispatch(event);
     }
}