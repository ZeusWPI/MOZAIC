import { createReadStream } from "fs";
import { ProtobufReader } from "./networking/ProtobufStream";
import * as protocol_root from './proto';
import { SimpleEventEmitter, EventType } from "./reactors/SimpleEventEmitter";
import LogEvent = protocol_root.mozaic.log.LogEvent;
import * as events from './events';
import { ISimpleEvent } from "ste-simple-events";

// TODO: this should be made into a proper class that forms the basis
// for pull-based log parsing, with a separate stream for each clientid.
// duality with the logger code would be really nice.

export class Replayer {
    emitters: {[clientId: number]: SimpleEventEmitter};

    constructor() {
        this.emitters = {};
    }

    public clientStream(clientId: number): SimpleEventEmitter {
        let emitter = this.emitters[clientId];
        if (!emitter) {
            emitter = new SimpleEventEmitter();
            this.emitters[clientId] = emitter;
        }
        return emitter;
    }

    public on<T>(eventType: EventType<T>): ISimpleEvent<T> {
        return this.clientStream(0).on(eventType);
    }

    public emit(logEvent: LogEvent) {
        const emitter = this.emitters[logEvent.clientId];
        if (emitter) {
            emitter.handleWireEvent({
                typeId: logEvent.eventType,
                data: logEvent.data,
            });
        }
    }
}

const replayer = new Replayer();

// just print all events for now
Object.keys(events).forEach((eventName) => {
    replayer.on(events[eventName]).subscribe((event) => {
        console.log(event);
    });
});


const logStream = createReadStream('log.out');
const messageStream = logStream.pipe(new ProtobufReader());

messageStream.on('data', (bytes: Uint8Array) => {
    const logEvent = LogEvent.decode(bytes);
    replayer.emit(logEvent);
});