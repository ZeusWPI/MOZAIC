import { Connection } from "./Connection";
import { Transport } from "./Transport";
import * as sodium from 'libsodium-wrappers';

import * as protocol_root from '../proto';
import proto = protocol_root.mozaic.protocol;


export class Handshaker {
    private connection: Connection;
    private transport: Transport;
    private server_nonce?: Uint8Array;

    private _resolve?: () => void;
    private _reject?: (Error) => void;

    constructor(transport: Transport, connection: Connection) {
        this.transport = transport;
        this.connection = connection;
    }

    public initiate(message: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;

            this.sendConnectionRequest(message);
        });
    }

    public handleMessage(data: Uint8Array) {
        let signedMessage = proto.SignedMessage.decode(data);
        // TODO: verify signature
        let response = proto.HandshakeServerMessage.decode(signedMessage.data);
        if (response.challenge) {
            this.sendChallengeResponse(response.challenge.nonce!);
        } else if (response.connectionAccepted) {
            // TODO this is not particulary nice
            if (this._resolve) {
                this._resolve();
            }
        } else if (response.connectionRefused) {
            // TODO this is not particulary nice either
            if (this._reject) {
                let err = new Error(response.connectionRefused.message!);
                this._reject(err);
            }
        }
    }


    private sendConnectionRequest(message: Uint8Array) {
        let encodedRequest = proto.ConnectionRequest.encode({ message }).finish();
        this.sendSignedMessage(encodedRequest);
    }

    private sendChallengeResponse(nonce: Uint8Array) {
        let encodedResponse = proto.ChallengeResponse.encode({ nonce }).finish();
        this.sendSignedMessage(encodedResponse);
    }

    private sendSignedMessage(data: Uint8Array) {
        const key = this.connection.secretKey;
        const signature = sodium.crypto_sign_detached(data, key);
        const encodedMessage = proto.SignedMessage.encode({
            data,
            signature,
        }).finish();
        this.transport.sendFrame(encodedMessage);
    }

}