import { WriteStream, createWriteStream } from "fs";

export class Logger {
    writeStream: WriteStream;

    constructor(path: string) {
        this.writeStream = createWriteStream(path);
    }
}