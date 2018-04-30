import { Transform } from 'stream';
import { BufferReader, BufferWriter } from 'protobufjs';

/**
 * Take a byte stream of length-delimited protobuf messages, and
 * output an object stream of the segmented buffers.
 */
// TODO: is a flush implementation required?
export class ProtobufReader extends Transform {
    private buffer: Buffer;

    constructor(options?: object) {
        super({
            ...options,
            readableObjectMode: true,
        });
        this.buffer = new Buffer(0);
    }

    public _transform(chunk: Buffer, encoding: string, callback: Function) {
        // Buffer.concat returns a new buffer, so the bytes are copied over
        // from recvBuffer, so that the old value becomes garbage.
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.readMessages();
        callback();
    }

    /**
     * Parse complete messages from internal buffer and output them.
     */
    private readMessages() {
        let pos = 0;
        let reader = new BufferReader(this.buffer);

        while (pos < this.buffer.length) {
            let end: number;
            try {
                // try reading segment length at pos
                reader.pos = pos;
                let len = reader.uint32();
                end = reader.pos + len;
            } catch(err) {
                if (err instanceof RangeError) {
                    // range errors are due to incomplete data
                    break;
                } else {
                    // other errors are not supposed to happen
                    throw(err);
                }
            }

            if (end > this.buffer.length) {
                // not enough data
                break;
            }

            // reader.pos is now at the first byte after the segment length
            let bytes = this.buffer.slice(reader.pos, end);
            // output bytes
            this.push(bytes);
            // advance position
            pos = end;
        }

        // set buffer to a tail of the current value. This avoids copying the
        // data; this happens anyway when the buffer gets extended with a new
        // chunk.
        this.buffer = this.buffer.slice(pos);
    }
}

/**
 * Takes ProtobufJs write operations and writes them to a byte stream.
 */
export class ProtobufWriter extends Transform {

    constructor(options?: object) {
        super({
            ...options,
            writableObjectMode: true,
        });
    }

    public _transform(w: BufferWriter, encoding: string, callback: Function) {
        const buf = w.ldelim().finish();
        callback(null, buf);
    }
}