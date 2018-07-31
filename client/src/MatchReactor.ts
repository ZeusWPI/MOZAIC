import { ProtobufStream } from "./ProtobufStream";
import { SimpleEventEmitter, EventType } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { Connection, ClientParams } from './Connection';
import { EventChannel, WireEvent } from "./EventChannel";
import { FollowerConnected, FollowerDisconnected } from "./events";


export class MatchReactor {
    private eventChannel: EventChannel;
    private core: SimpleEventEmitter;

    constructor(clientParams: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventChannel = new EventChannel(clientParams);

        this.eventChannel.onEvent.subscribe((wireEvent) => {
            this.core.handleWireEvent(wireEvent);
        });

        this.eventChannel.onConnect.subscribe((_) => {
            this.core.handleEvent(FollowerConnected.create({}));
        })

        this.eventChannel.onDisconnect.subscribe(() => {
            this.core.handleEvent(FollowerDisconnected.create({}));
        })
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.core.on(eventType);
    }

    public connect() {
        this.eventChannel.connect();
    }

    public dispatch(event: any) {
       this.eventChannel.sendEvent(event);
    }
}