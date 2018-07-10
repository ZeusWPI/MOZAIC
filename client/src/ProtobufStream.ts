import { Transform } from 'stream';
import { BufferReader, BufferWriter } from 'protobufjs';
import { Socket } from 'net';
import { SignalDispatcher, ISignal } from 'ste-signals';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

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
        console.log('bla');
        callback(null, buf);
    }
}

export class ProtobufStream {
    private _reader = new ProtobufReader();
    private _socket = new Socket();

    private _onConnect = new SignalDispatcher();
    private _onClose = new SignalDispatcher();
    private _onData = new SimpleEventDispatcher<Uint8Array>();

    constructor() {
        this._socket.pipe(this._reader);

        this._socket.on('connect', () => {
            this._onConnect.dispatch();
        });

        this._socket.on('close', () => {
            this._onClose.dispatch();
        });

        this._reader.on('data', (data: Uint8Array) => {
            this._onData.dispatch(data);
        });
    }

    public connect(host: string, port: number) {
        this._socket.connect(port, host);
    }

    public end() {
        this._socket.end();
    }

    public write(writer: BufferWriter) {
        const buf = writer.ldelim().finish();
        this._socket.write(buf);
    }

    public get readStream() {
        return this._reader;
    }

    public get onConnect() {
        return this._onConnect.asEvent();
    }

    public get onClose() {
        return this._onClose.asEvent();
    }

    public get onMessage() {
        return this._onData.asEvent();
    }

}