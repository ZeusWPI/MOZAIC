import { execFile, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as split2 from 'split2';
import { Readable } from 'stream';

export interface BotConfig {
    command: string;
    args: string[];
}

interface Bot {
    process: ChildProcess,
    output: Readable,
}

export type OutputHandler = (line: string) => void;

export class BotRunner extends EventEmitter {
    readonly config: BotConfig;
    private bot?: Bot;
    private handlerQueue: OutputHandler[];
    private defaultHandler = (line: string) => {};

    constructor(config: BotConfig) {
        super();
        this.handlerQueue = [];
        this.config = config;
    }

    /**
     * Run the bot
     */
    public run() {
        const config = this.config;
        let process = execFile(config.command, config.args);
        this.setProcess(process);
    }

    public request(query: string, handler: OutputHandler) {
        this.handlerQueue.push(handler);
        this.sendMessage(query);
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
        process.on('exit', () => console.log('BOT EXITTED'));
        process.on('error', (err: Error) => console.log(`ERROR: ${err}`));

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