import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as split2 from 'split2';
import { Readable } from 'stream';

export interface BotConfig {
    command: string;
    args?: string[];
}

interface Bot {
    process: ChildProcess,
    output: Readable,
}

export class BotRunner extends EventEmitter {
    readonly config: BotConfig;
    private bot?: Bot;

    constructor(config: BotConfig) {
        super();
        this.config = config;
    }

    /**
     * Run the bot
     */
    public run() {
        const config = this.config;
        let process = spawn(config.command, config.args);
        this.setProcess(process);
    }

    /**
     * Send a message to the running bot
     * @param message the message to send
     */
    public sendMessage(message: Buffer | string) {
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
            let data = Buffer.from(line, 'utf-8');
            this.onData(data);
        });

        this.bot = {
            process,
            output,
        };
    }

    private onData(data: Buffer) {
        this.emit('message', data);
    }
}