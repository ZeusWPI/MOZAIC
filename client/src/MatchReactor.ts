import { ProtobufStream } from "./ProtobufStream";
import { Reactor, SimpleEventEmitter, AnyEvent, EventType, WireEvent, SomeEvent } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { Connection, ClientParams } from './Connection';
import { EventChannel } from "./EventChannel";
import { FollowerConnected, FollowerDisconnected } from "./events";


export class MatchReactor {
    private eventChannel: EventChannel;
    private core: SimpleEventEmitter;

    constructor(clientParams: ClientParams) {
        this.core = new SimpleEventEmitter();
        this.eventChannel = new EventChannel(clientParams);

        this.eventChannel.onEvent.subscribe((someEvent) => {
            someEvent.handle(this.core);
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

    public dispatch(event: SomeEvent) {
       this.eventChannel.dispatch(event);
    }
}