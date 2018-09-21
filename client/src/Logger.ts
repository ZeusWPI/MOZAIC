import { WriteStream, createWriteStream } from "fs";
import * as protocol_root from './proto';
import { WireEvent } from "./networking/EventWire";
const { LogEvent } = protocol_root.mozaic.log;

export class Logger {
    sink: WriteStream;

    constructor(sinkPath: string) {
        this.sink = createWriteStream(sinkPath);
    }

    public log(clientId: number, event: WireEvent) {
        const logEvent = LogEvent.create({
            eventType: event.typeId,
            data: event.data,
            clientId,
        });
        const bytes = LogEvent.encodeDelimited(logEvent).finish();
        this.sink.write(bytes);
    }
}

// TODO: split this into a log sink and a client-specific logger object
// TODO: add an eventemitter for records?
export class ClientLogger {
    private logger: Logger;
    private clientId: number;

    constructor(logger: Logger, clientId: number) {
        this.logger = logger;
        this.clientId = clientId;
    }

    public log(event: WireEvent) {
        this.logger.log(this.clientId, event);
    }
}