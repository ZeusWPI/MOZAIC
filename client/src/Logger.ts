import * as stream from 'stream';
import { LogEntry, LogRecord } from './PwTypes';

export class Logger {
    readonly player: number;
    private sink: stream.Writable;

    constructor(player: number, sink: stream.Writable) {
        this.sink = sink;
        this.player = player;
    }

    public log(record: LogRecord) {
        let entry: LogEntry = { player: this.player, record }
        let str = JSON.stringify(entry) + '\n';
        this.sink.write(str);
    }
}