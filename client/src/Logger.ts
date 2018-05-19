import * as stream from 'stream';
import { LogEntry, LogRecord } from './PwTypes';

export class Logger {
    private sink: stream.Writable;

    constructor(sink: stream.Writable) {
        this.sink = sink;
    }

    public log(entry: LogEntry) {
        let str = JSON.stringify(entry) + '\n';
        this.sink.write(str);
    }
}

export class ClientLogger {
    private logger: Logger;
    readonly player: number;

    constructor(logger: Logger, player: number) {
        this.logger = logger;
        this.player = player;
    }

    public log(record: LogRecord) {
        this.logger.log({
            type: "player_entry",
            player: this.player,
            record
        });
    }
}