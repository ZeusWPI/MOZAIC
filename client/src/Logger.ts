import * as stream from 'stream';
import { LogEntry, LogRecord } from './PwTypes';
import * as fs from 'fs';

export class Logger {
    private sink: stream.Writable;

    constructor(logFile: string) {
        this.sink = fs.createWriteStream(logFile)
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