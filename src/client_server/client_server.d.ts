import * as $protobuf from "protobufjs";

/** Namespace mozaic. */
export namespace mozaic {

    /** Namespace client_server. */
    namespace client_server {

        /** Properties of a CreateMatch. */
        interface ICreateMatch {

            /** CreateMatch playerCount */
            playerCount?: (number|Long|null);

            /** CreateMatch matchData */
            matchData?: (Uint8Array|null);
        }

        /** Represents a CreateMatch. */
        class CreateMatch implements ICreateMatch {

            /**
             * Constructs a new CreateMatch.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.ICreateMatch);

            /** CreateMatch playerCount. */
            public playerCount: (number|Long);

            /** CreateMatch matchData. */
            public matchData: Uint8Array;

            /**
             * Creates a new CreateMatch instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CreateMatch instance
             */
            public static create(properties?: mozaic.client_server.ICreateMatch): mozaic.client_server.CreateMatch;

            /**
             * Encodes the specified CreateMatch message. Does not implicitly {@link mozaic.client_server.CreateMatch.verify|verify} messages.
             * @param message CreateMatch message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.ICreateMatch, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CreateMatch message, length delimited. Does not implicitly {@link mozaic.client_server.CreateMatch.verify|verify} messages.
             * @param message CreateMatch message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.ICreateMatch, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CreateMatch message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CreateMatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.CreateMatch;

            /**
             * Decodes a CreateMatch message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CreateMatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.CreateMatch;

            /**
             * Verifies a CreateMatch message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CreateMatch message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CreateMatch
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.CreateMatch;

            /**
             * Creates a plain object from a CreateMatch message. Also converts values to other types if specified.
             * @param message CreateMatch
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.CreateMatch, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CreateMatch to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CreateMatchResponse. */
        interface ICreateMatchResponse {

            /** CreateMatchResponse created */
            created?: (mozaic.client_server.IMatchCreated|null);

            /** CreateMatchResponse error */
            error?: (string|null);
        }

        /** Represents a CreateMatchResponse. */
        class CreateMatchResponse implements ICreateMatchResponse {

            /**
             * Constructs a new CreateMatchResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.ICreateMatchResponse);

            /** CreateMatchResponse created. */
            public created?: (mozaic.client_server.IMatchCreated|null);

            /** CreateMatchResponse error. */
            public error: string;

            /** CreateMatchResponse response. */
            public response?: ("created"|"error");

            /**
             * Creates a new CreateMatchResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CreateMatchResponse instance
             */
            public static create(properties?: mozaic.client_server.ICreateMatchResponse): mozaic.client_server.CreateMatchResponse;

            /**
             * Encodes the specified CreateMatchResponse message. Does not implicitly {@link mozaic.client_server.CreateMatchResponse.verify|verify} messages.
             * @param message CreateMatchResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.ICreateMatchResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CreateMatchResponse message, length delimited. Does not implicitly {@link mozaic.client_server.CreateMatchResponse.verify|verify} messages.
             * @param message CreateMatchResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.ICreateMatchResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CreateMatchResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CreateMatchResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.CreateMatchResponse;

            /**
             * Decodes a CreateMatchResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CreateMatchResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.CreateMatchResponse;

            /**
             * Verifies a CreateMatchResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CreateMatchResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CreateMatchResponse
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.CreateMatchResponse;

            /**
             * Creates a plain object from a CreateMatchResponse message. Also converts values to other types if specified.
             * @param message CreateMatchResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.CreateMatchResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CreateMatchResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MatchCreated. */
        interface IMatchCreated {

            /** MatchCreated gameToken */
            gameToken?: (Uint8Array|null);

            /** MatchCreated playerTokens */
            playerTokens?: (Uint8Array[]|null);
        }

        /** Represents a MatchCreated. */
        class MatchCreated implements IMatchCreated {

            /**
             * Constructs a new MatchCreated.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IMatchCreated);

            /** MatchCreated gameToken. */
            public gameToken: Uint8Array;

            /** MatchCreated playerTokens. */
            public playerTokens: Uint8Array[];

            /**
             * Creates a new MatchCreated instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MatchCreated instance
             */
            public static create(properties?: mozaic.client_server.IMatchCreated): mozaic.client_server.MatchCreated;

            /**
             * Encodes the specified MatchCreated message. Does not implicitly {@link mozaic.client_server.MatchCreated.verify|verify} messages.
             * @param message MatchCreated message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IMatchCreated, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MatchCreated message, length delimited. Does not implicitly {@link mozaic.client_server.MatchCreated.verify|verify} messages.
             * @param message MatchCreated message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IMatchCreated, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MatchCreated message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MatchCreated
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.MatchCreated;

            /**
             * Decodes a MatchCreated message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MatchCreated
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.MatchCreated;

            /**
             * Verifies a MatchCreated message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MatchCreated message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MatchCreated
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.MatchCreated;

            /**
             * Creates a plain object from a MatchCreated message. Also converts values to other types if specified.
             * @param message MatchCreated
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.MatchCreated, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MatchCreated to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Connect. */
        interface IConnect {

            /** Connect token */
            token?: (Uint8Array|null);
        }

        /** Represents a Connect. */
        class Connect implements IConnect {

            /**
             * Constructs a new Connect.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IConnect);

            /** Connect token. */
            public token: Uint8Array;

            /**
             * Creates a new Connect instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Connect instance
             */
            public static create(properties?: mozaic.client_server.IConnect): mozaic.client_server.Connect;

            /**
             * Encodes the specified Connect message. Does not implicitly {@link mozaic.client_server.Connect.verify|verify} messages.
             * @param message Connect message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IConnect, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Connect message, length delimited. Does not implicitly {@link mozaic.client_server.Connect.verify|verify} messages.
             * @param message Connect message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IConnect, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Connect message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Connect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.Connect;

            /**
             * Decodes a Connect message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Connect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.Connect;

            /**
             * Verifies a Connect message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Connect message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Connect
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.Connect;

            /**
             * Creates a plain object from a Connect message. Also converts values to other types if specified.
             * @param message Connect
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.Connect, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Connect to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ConnectResponse. */
        interface IConnectResponse {

            /** ConnectResponse connected */
            connected?: (mozaic.client_server.IConnected|null);

            /** ConnectResponse error */
            error?: (string|null);
        }

        /** Represents a ConnectResponse. */
        class ConnectResponse implements IConnectResponse {

            /**
             * Constructs a new ConnectResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IConnectResponse);

            /** ConnectResponse connected. */
            public connected?: (mozaic.client_server.IConnected|null);

            /** ConnectResponse error. */
            public error: string;

            /** ConnectResponse response. */
            public response?: ("connected"|"error");

            /**
             * Creates a new ConnectResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConnectResponse instance
             */
            public static create(properties?: mozaic.client_server.IConnectResponse): mozaic.client_server.ConnectResponse;

            /**
             * Encodes the specified ConnectResponse message. Does not implicitly {@link mozaic.client_server.ConnectResponse.verify|verify} messages.
             * @param message ConnectResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IConnectResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConnectResponse message, length delimited. Does not implicitly {@link mozaic.client_server.ConnectResponse.verify|verify} messages.
             * @param message ConnectResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IConnectResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConnectResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConnectResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.ConnectResponse;

            /**
             * Decodes a ConnectResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConnectResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.ConnectResponse;

            /**
             * Verifies a ConnectResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConnectResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConnectResponse
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.ConnectResponse;

            /**
             * Creates a plain object from a ConnectResponse message. Also converts values to other types if specified.
             * @param message ConnectResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.ConnectResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConnectResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Connected. */
        interface IConnected {
        }

        /** Represents a Connected. */
        class Connected implements IConnected {

            /**
             * Constructs a new Connected.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IConnected);

            /**
             * Creates a new Connected instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Connected instance
             */
            public static create(properties?: mozaic.client_server.IConnected): mozaic.client_server.Connected;

            /**
             * Encodes the specified Connected message. Does not implicitly {@link mozaic.client_server.Connected.verify|verify} messages.
             * @param message Connected message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IConnected, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Connected message, length delimited. Does not implicitly {@link mozaic.client_server.Connected.verify|verify} messages.
             * @param message Connected message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IConnected, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Connected message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Connected
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.Connected;

            /**
             * Decodes a Connected message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Connected
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.Connected;

            /**
             * Verifies a Connected message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Connected message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Connected
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.Connected;

            /**
             * Creates a plain object from a Connected message. Also converts values to other types if specified.
             * @param message Connected
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.Connected, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Connected to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ClientMessage. */
        interface IClientMessage {

            /** ClientMessage gameData */
            gameData?: (mozaic.client_server.IGameData|null);

            /** ClientMessage disconnect */
            disconnect?: (mozaic.client_server.IDisconnect|null);
        }

        /** Represents a ClientMessage. */
        class ClientMessage implements IClientMessage {

            /**
             * Constructs a new ClientMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IClientMessage);

            /** ClientMessage gameData. */
            public gameData?: (mozaic.client_server.IGameData|null);

            /** ClientMessage disconnect. */
            public disconnect?: (mozaic.client_server.IDisconnect|null);

            /** ClientMessage message. */
            public message?: ("gameData"|"disconnect");

            /**
             * Creates a new ClientMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ClientMessage instance
             */
            public static create(properties?: mozaic.client_server.IClientMessage): mozaic.client_server.ClientMessage;

            /**
             * Encodes the specified ClientMessage message. Does not implicitly {@link mozaic.client_server.ClientMessage.verify|verify} messages.
             * @param message ClientMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IClientMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ClientMessage message, length delimited. Does not implicitly {@link mozaic.client_server.ClientMessage.verify|verify} messages.
             * @param message ClientMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IClientMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ClientMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.ClientMessage;

            /**
             * Decodes a ClientMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.ClientMessage;

            /**
             * Verifies a ClientMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ClientMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ClientMessage
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.ClientMessage;

            /**
             * Creates a plain object from a ClientMessage message. Also converts values to other types if specified.
             * @param message ClientMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.ClientMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ClientMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GameData. */
        interface IGameData {

            /** GameData data */
            data?: (Uint8Array|null);
        }

        /** Represents a GameData. */
        class GameData implements IGameData {

            /**
             * Constructs a new GameData.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IGameData);

            /** GameData data. */
            public data: Uint8Array;

            /**
             * Creates a new GameData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GameData instance
             */
            public static create(properties?: mozaic.client_server.IGameData): mozaic.client_server.GameData;

            /**
             * Encodes the specified GameData message. Does not implicitly {@link mozaic.client_server.GameData.verify|verify} messages.
             * @param message GameData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IGameData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GameData message, length delimited. Does not implicitly {@link mozaic.client_server.GameData.verify|verify} messages.
             * @param message GameData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IGameData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GameData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GameData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.GameData;

            /**
             * Decodes a GameData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GameData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.GameData;

            /**
             * Verifies a GameData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GameData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GameData
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.GameData;

            /**
             * Creates a plain object from a GameData message. Also converts values to other types if specified.
             * @param message GameData
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.GameData, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GameData to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Disconnect. */
        interface IDisconnect {
        }

        /** Represents a Disconnect. */
        class Disconnect implements IDisconnect {

            /**
             * Constructs a new Disconnect.
             * @param [properties] Properties to set
             */
            constructor(properties?: mozaic.client_server.IDisconnect);

            /**
             * Creates a new Disconnect instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Disconnect instance
             */
            public static create(properties?: mozaic.client_server.IDisconnect): mozaic.client_server.Disconnect;

            /**
             * Encodes the specified Disconnect message. Does not implicitly {@link mozaic.client_server.Disconnect.verify|verify} messages.
             * @param message Disconnect message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: mozaic.client_server.IDisconnect, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Disconnect message, length delimited. Does not implicitly {@link mozaic.client_server.Disconnect.verify|verify} messages.
             * @param message Disconnect message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: mozaic.client_server.IDisconnect, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Disconnect message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Disconnect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): mozaic.client_server.Disconnect;

            /**
             * Decodes a Disconnect message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Disconnect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): mozaic.client_server.Disconnect;

            /**
             * Verifies a Disconnect message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Disconnect message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Disconnect
             */
            public static fromObject(object: { [k: string]: any }): mozaic.client_server.Disconnect;

            /**
             * Creates a plain object from a Disconnect message. Also converts values to other types if specified.
             * @param message Disconnect
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: mozaic.client_server.Disconnect, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Disconnect to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
