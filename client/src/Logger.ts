import { WriteStream, createWriteStream } from "fs";
import * as protocol_root from './proto';
import { WireEvent } from "./networking/EventWire";
const { LogEvent } = protocol_root.mozaic.log;

// TODO: split this into a log sink and a client-specific logger object
// TODO: add an eventemitter for records?
export class Logger {
    writeStream: WriteStream;
    clientId: number;

    constructor(clientId: number, sink: WriteStream) {
        this.writeStream = sink;
        this.clientId = clientId;
    }

    public log(event: WireEvent) {
        // TODO: should clientId be optional?
        const logEvent = LogEvent.create({
            clientId: this.clientId,
            eventType: event.typeId,
            data: event.data,
        });
        const bytes = LogEvent.encodeDelimited(logEvent).finish();
        this.writeStream.write(bytes);
    }
}