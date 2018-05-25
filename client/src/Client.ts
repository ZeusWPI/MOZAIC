import { Logger, Connection } from "./index";
import { LogRecord } from "./PwTypes";
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

export interface ClientParams {
    host: string;
    port: number;
    token: Uint8Array;
    logger: Logger;
}

export interface ClientProps {
    clientId: number;
    connection: Connection;
    logger: Logger;
}

export class Client {
    clientId: number;
    connection: Connection;
    logger: Logger;

    public static connect(params: ClientParams): Promise<Client> {
        return new Promise((resolve, reject) => {
            const connection = new Connection(params.token);
            connection.onConnect.one((clientId) => {
                const client = new Client({
                    clientId,
                    connection,
                    logger: params.logger,
                });
                resolve(client);
            });
            connection.onError.one((err) => {
                reject(err);
            });

            connection.connect(params.host, params.port);
        });
    }

    constructor(props: ClientProps) {
        this.clientId = props.clientId;
        this.connection = props.connection;
        this.logger = props.logger;
    }

    public log(record: LogRecord) {
        this.logger.log({
            type: "player_entry",
            player: this.clientId,
            record,
        });
    }

    public send_message(message: Uint8Array) {
        this.connection.send(message);
    }

    public get onMessage() {
        return this.connection.onMessage;
    }
}