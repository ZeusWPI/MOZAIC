import * as stream from 'stream';

export class Logger {
    readonly player: number;
    private sink: stream.Writable;

    constructor(player: number, sink: stream.Writable) {
        this.sink = sink;
        this.player = player;
    }

    public log(data: object) {
        let record = { player: this.player, data }
        let str = JSON.stringify(record) + '\n';
        this.sink.write(str);
    }
}