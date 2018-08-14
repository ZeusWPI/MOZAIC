import { WriteStream, createWriteStream } from "fs";
import * as protocol_root from './proto';
import { WireEvent } from "./networking/EventWire";
const { LogEvent } = protocol_root.mozaic.log;

export class Logger {
    writeStream: WriteStream;
    clientId: number;

    constructor(clientId: number, path: string) {
        this.writeStream = createWriteStream(path);
        this.clientId = clientId;
    }

    public log(event: WireEvent) {
        const logEvent = LogEvent.create({
            clientId: this.clientId,
            eventType: event.typeId,
            data: event.data,
        });
        const bytes = LogEvent.encodeDelimited(logEvent).finish();
        this.writeStream.write(bytes);
    }
}