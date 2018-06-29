import { ProtobufStream } from "./ProtobufStream";
import { Reactor, STEReactor, AnyEvent, EventType, WireEvent, SomeEvent } from "./reactor";
import { ISimpleEvent } from 'ste-simple-events';
import { Connection, ClientParams } from './Connection';
import { EventChannel } from "./EventChannel";
import { FollowerConnected, FollowerDisconnected } from "./events";


export class MatchReactor {
    private eventChannel: EventChannel;
    private reactor: STEReactor;

    constructor(clientParams: ClientParams) {
        this.reactor = new STEReactor();
        this.eventChannel = new EventChannel(clientParams);

        this.eventChannel.onEvent.subscribe((someEvent) => {
            someEvent.handle(this.reactor);
        });

        this.eventChannel.onConnect.subscribe((_) => {
            this.reactor.handleEvent(FollowerConnected.create({}));
        })

        this.eventChannel.onDisconnect.subscribe(() => {
            this.reactor.handleEvent(FollowerDisconnected.create({}));
        })
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.reactor.on(eventType);
    }

    public connect() {
        this.eventChannel.connect();
    }

    public dispatch(event: SomeEvent) {
       this.eventChannel.dispatch(event);
    }
}