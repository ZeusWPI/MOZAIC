import { execFile, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as split2 from 'split2';
import { Readable } from 'stream';
import { SignalDispatcher, ISignal } from 'ste-signals';
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

export interface BotConfig {
    command: string;
    args: string[];
}

interface Bot {
    process: ChildProcess,
    output: Readable,
}

export type OutputHandler = (line: string) => void;

export class BotRunner {
    readonly config: BotConfig;
    private bot?: Bot;
    private handlerQueue: OutputHandler[];
    private defaultHandler = (line: string) => {};

    private _onExit = new SignalDispatcher();
    private _onError = new SimpleEventDispatcher<Error>();

    constructor(config: BotConfig) {
        this.handlerQueue = [];
        this.config = config;
    }

    /**
     * Run the bot
     */
    public run(meta: string) {
        const config = this.config;
        let process = execFile(config.command, config.args, (error) => {
            if (error) {
                this._onError.dispatch(error);
            }
          });
        this.setProcess(process);
        this.sendMessage(meta);
    }

    public send(message: string) {
        this.sendMessage(message);
    }

    public request(query: string, handler: OutputHandler) {
        this.handlerQueue.push(handler);
        this.sendMessage(query);
    }

    public get onExit() {
        return this._onExit.asEvent();
    }

    public get onError() {
        return this._onError.asEvent();
    }

    /**
     * Send a message to the running bot
     * @param message the message to send
     */
    private sendMessage(message: Uint8Array | string) {
        if (this.bot) {
            this.bot.process.stdin.write(message + '\n');
        } else {
            throw "trying to send to a process that is not running";
        }
    }

    public killBot() {
        if (this.bot) {
            this.bot.process.kill();
        }
    }

    /**
     * Set the process this BotRunner manages and attach listeners.
     * @param process The process to monitor
     */
    private setProcess(process: ChildProcess) {
        const output = process.stdout.pipe(split2());

        output.on('data', (line: string) => {
            this.onLine(line);
        });

        process.stderr.on('data', (data: Buffer) => {
            console.log(data.toString('utf-8'));
        });

        // TODO: handle these better
        process.on('exit', () => {
            this._onExit.dispatch();
        });
        process.on('error', (err: Error) => {
            this._onError.dispatch(err);
        });

        this.bot = {
            process,
            output,
        };
    }

    private onLine(line: string) {
        const handler = this.handlerQueue.shift();
        if (handler) {
            handler(line);
        } else {
            this.defaultHandler(line);
        }
    }
}