import { createReadStream } from "fs";
import { ProtobufReader } from "./networking/ProtobufStream";
import * as protocol_root from './proto';
import { SimpleEventEmitter } from "./reactors/SimpleEventEmitter";
const { LogEvent } = protocol_root.mozaic.log;
import * as events from './events';

// TODO: this should be made into a proper class that forms the basis
// for pull-based log parsing, with a separate stream for each clientid.
// duality with the logger code would be really nice.


const eventEmitter = new SimpleEventEmitter();

// just print all events for now
Object.keys(events).forEach((eventName) => {
    eventEmitter.on(events[eventName]).subscribe((event) => {
        console.log(event);
    });
});


const logStream = createReadStream('log.out');
const messageStream = logStream.pipe(new ProtobufReader());

messageStream.on('data', (bytes: Uint8Array) => {
    const logEvent = LogEvent.decode(bytes);
    if (logEvent.clientId != 0) {
        // ignore player messages for now
        return;
    }

    eventEmitter.handleWireEvent({
        typeId: logEvent.eventType,
        data: logEvent.data,
    });
});