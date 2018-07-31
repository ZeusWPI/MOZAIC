import { EventChannel } from "./EventChannel";
import { ClientParams } from "./Connection";
import { SimpleEventEmitter, EventType } from "./reactor";
import { ISimpleEvent } from "ste-simple-events";
import { LeaderConnected, LeaderDisconnected } from "./events";

export class ClientReactor {
    eventChannel: EventChannel;
    private core: SimpleEventEmitter;

    constructor(params: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventChannel = new EventChannel(params);

        this.eventChannel.onEvent.subscribe((event) => {
            this.core.handleWireEvent(event);
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

    public exit() {
        this.eventChannel.disconnect();
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }
''
    public dispatch(event: any) {
        this.core.handleEvent(event);
        this.eventChannel.sendEvent(event);
     }
}