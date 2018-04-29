import * as stream from 'stream';
import { LogMessage, LogRecord } from './PwLog';

export class Logger {
    readonly player: number;
    private sink: stream.Writable;

    constructor(player: number, sink: stream.Writable) {
        this.sink = sink;
        this.player = player;
    }

    public log(message: LogMessage) {
        let record: LogRecord = { player: this.player, message }
        let str = JSON.stringify(record) + '\n';
        this.sink.write(str);
    }
}