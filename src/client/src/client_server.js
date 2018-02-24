/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.mozaic = (function() {

    /**
     * Namespace mozaic.
     * @exports mozaic
     * @namespace
     */
    var mozaic = {};

    mozaic.client_server = (function() {

        /**
         * Namespace client_server.
         * @memberof mozaic
         * @namespace
         */
        var client_server = {};

        client_server.CreateMatch = (function() {

            /**
             * Properties of a CreateMatch.
             * @memberof mozaic.client_server
             * @interface ICreateMatch
             * @property {number|Long|null} [playerCount] CreateMatch playerCount
             * @property {Uint8Array|null} [matchData] CreateMatch matchData
             */

            /**
             * Constructs a new CreateMatch.
             * @memberof mozaic.client_server
             * @classdesc Represents a CreateMatch.
             * @implements ICreateMatch
             * @constructor
             * @param {mozaic.client_server.ICreateMatch=} [properties] Properties to set
             */
            function CreateMatch(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CreateMatch playerCount.
             * @member {number|Long} playerCount
             * @memberof mozaic.client_server.CreateMatch
             * @instance
             */
            CreateMatch.prototype.playerCount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * CreateMatch matchData.
             * @member {Uint8Array} matchData
             * @memberof mozaic.client_server.CreateMatch
             * @instance
             */
            CreateMatch.prototype.matchData = $util.newBuffer([]);

            /**
             * Creates a new CreateMatch instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {mozaic.client_server.ICreateMatch=} [properties] Properties to set
             * @returns {mozaic.client_server.CreateMatch} CreateMatch instance
             */
            CreateMatch.create = function create(properties) {
                return new CreateMatch(properties);
            };

            /**
             * Encodes the specified CreateMatch message. Does not implicitly {@link mozaic.client_server.CreateMatch.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {mozaic.client_server.ICreateMatch} message CreateMatch message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CreateMatch.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.playerCount != null && message.hasOwnProperty("playerCount"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.playerCount);
                if (message.matchData != null && message.hasOwnProperty("matchData"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.matchData);
                return writer;
            };

            /**
             * Encodes the specified CreateMatch message, length delimited. Does not implicitly {@link mozaic.client_server.CreateMatch.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {mozaic.client_server.ICreateMatch} message CreateMatch message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CreateMatch.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CreateMatch message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.CreateMatch} CreateMatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CreateMatch.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.CreateMatch();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.playerCount = reader.int64();
                        break;
                    case 2:
                        message.matchData = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CreateMatch message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.CreateMatch} CreateMatch
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CreateMatch.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CreateMatch message.
             * @function verify
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CreateMatch.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.playerCount != null && message.hasOwnProperty("playerCount"))
                    if (!$util.isInteger(message.playerCount) && !(message.playerCount && $util.isInteger(message.playerCount.low) && $util.isInteger(message.playerCount.high)))
                        return "playerCount: integer|Long expected";
                if (message.matchData != null && message.hasOwnProperty("matchData"))
                    if (!(message.matchData && typeof message.matchData.length === "number" || $util.isString(message.matchData)))
                        return "matchData: buffer expected";
                return null;
            };

            /**
             * Creates a CreateMatch message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.CreateMatch} CreateMatch
             */
            CreateMatch.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.CreateMatch)
                    return object;
                var message = new $root.mozaic.client_server.CreateMatch();
                if (object.playerCount != null)
                    if ($util.Long)
                        (message.playerCount = $util.Long.fromValue(object.playerCount)).unsigned = false;
                    else if (typeof object.playerCount === "string")
                        message.playerCount = parseInt(object.playerCount, 10);
                    else if (typeof object.playerCount === "number")
                        message.playerCount = object.playerCount;
                    else if (typeof object.playerCount === "object")
                        message.playerCount = new $util.LongBits(object.playerCount.low >>> 0, object.playerCount.high >>> 0).toNumber();
                if (object.matchData != null)
                    if (typeof object.matchData === "string")
                        $util.base64.decode(object.matchData, message.matchData = $util.newBuffer($util.base64.length(object.matchData)), 0);
                    else if (object.matchData.length)
                        message.matchData = object.matchData;
                return message;
            };

            /**
             * Creates a plain object from a CreateMatch message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.CreateMatch
             * @static
             * @param {mozaic.client_server.CreateMatch} message CreateMatch
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CreateMatch.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.playerCount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.playerCount = options.longs === String ? "0" : 0;
                    object.matchData = options.bytes === String ? "" : [];
                }
                if (message.playerCount != null && message.hasOwnProperty("playerCount"))
                    if (typeof message.playerCount === "number")
                        object.playerCount = options.longs === String ? String(message.playerCount) : message.playerCount;
                    else
                        object.playerCount = options.longs === String ? $util.Long.prototype.toString.call(message.playerCount) : options.longs === Number ? new $util.LongBits(message.playerCount.low >>> 0, message.playerCount.high >>> 0).toNumber() : message.playerCount;
                if (message.matchData != null && message.hasOwnProperty("matchData"))
                    object.matchData = options.bytes === String ? $util.base64.encode(message.matchData, 0, message.matchData.length) : options.bytes === Array ? Array.prototype.slice.call(message.matchData) : message.matchData;
                return object;
            };

            /**
             * Converts this CreateMatch to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.CreateMatch
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CreateMatch.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return CreateMatch;
        })();

        client_server.CreateMatchResponse = (function() {

            /**
             * Properties of a CreateMatchResponse.
             * @memberof mozaic.client_server
             * @interface ICreateMatchResponse
             * @property {mozaic.client_server.IMatchCreated|null} [created] CreateMatchResponse created
             * @property {string|null} [error] CreateMatchResponse error
             */

            /**
             * Constructs a new CreateMatchResponse.
             * @memberof mozaic.client_server
             * @classdesc Represents a CreateMatchResponse.
             * @implements ICreateMatchResponse
             * @constructor
             * @param {mozaic.client_server.ICreateMatchResponse=} [properties] Properties to set
             */
            function CreateMatchResponse(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CreateMatchResponse created.
             * @member {mozaic.client_server.IMatchCreated|null|undefined} created
             * @memberof mozaic.client_server.CreateMatchResponse
             * @instance
             */
            CreateMatchResponse.prototype.created = null;

            /**
             * CreateMatchResponse error.
             * @member {string} error
             * @memberof mozaic.client_server.CreateMatchResponse
             * @instance
             */
            CreateMatchResponse.prototype.error = "";

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * CreateMatchResponse response.
             * @member {"created"|"error"|undefined} response
             * @memberof mozaic.client_server.CreateMatchResponse
             * @instance
             */
            Object.defineProperty(CreateMatchResponse.prototype, "response", {
                get: $util.oneOfGetter($oneOfFields = ["created", "error"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new CreateMatchResponse instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {mozaic.client_server.ICreateMatchResponse=} [properties] Properties to set
             * @returns {mozaic.client_server.CreateMatchResponse} CreateMatchResponse instance
             */
            CreateMatchResponse.create = function create(properties) {
                return new CreateMatchResponse(properties);
            };

            /**
             * Encodes the specified CreateMatchResponse message. Does not implicitly {@link mozaic.client_server.CreateMatchResponse.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {mozaic.client_server.ICreateMatchResponse} message CreateMatchResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CreateMatchResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.created != null && message.hasOwnProperty("created"))
                    $root.mozaic.client_server.MatchCreated.encode(message.created, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.error != null && message.hasOwnProperty("error"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.error);
                return writer;
            };

            /**
             * Encodes the specified CreateMatchResponse message, length delimited. Does not implicitly {@link mozaic.client_server.CreateMatchResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {mozaic.client_server.ICreateMatchResponse} message CreateMatchResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CreateMatchResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CreateMatchResponse message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.CreateMatchResponse} CreateMatchResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CreateMatchResponse.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.CreateMatchResponse();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.created = $root.mozaic.client_server.MatchCreated.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.error = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CreateMatchResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.CreateMatchResponse} CreateMatchResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CreateMatchResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CreateMatchResponse message.
             * @function verify
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CreateMatchResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.created != null && message.hasOwnProperty("created")) {
                    properties.response = 1;
                    {
                        var error = $root.mozaic.client_server.MatchCreated.verify(message.created);
                        if (error)
                            return "created." + error;
                    }
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    if (properties.response === 1)
                        return "response: multiple values";
                    properties.response = 1;
                    if (!$util.isString(message.error))
                        return "error: string expected";
                }
                return null;
            };

            /**
             * Creates a CreateMatchResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.CreateMatchResponse} CreateMatchResponse
             */
            CreateMatchResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.CreateMatchResponse)
                    return object;
                var message = new $root.mozaic.client_server.CreateMatchResponse();
                if (object.created != null) {
                    if (typeof object.created !== "object")
                        throw TypeError(".mozaic.client_server.CreateMatchResponse.created: object expected");
                    message.created = $root.mozaic.client_server.MatchCreated.fromObject(object.created);
                }
                if (object.error != null)
                    message.error = String(object.error);
                return message;
            };

            /**
             * Creates a plain object from a CreateMatchResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.CreateMatchResponse
             * @static
             * @param {mozaic.client_server.CreateMatchResponse} message CreateMatchResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CreateMatchResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.created != null && message.hasOwnProperty("created")) {
                    object.created = $root.mozaic.client_server.MatchCreated.toObject(message.created, options);
                    if (options.oneofs)
                        object.response = "created";
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    object.error = message.error;
                    if (options.oneofs)
                        object.response = "error";
                }
                return object;
            };

            /**
             * Converts this CreateMatchResponse to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.CreateMatchResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CreateMatchResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return CreateMatchResponse;
        })();

        client_server.MatchCreated = (function() {

            /**
             * Properties of a MatchCreated.
             * @memberof mozaic.client_server
             * @interface IMatchCreated
             * @property {Uint8Array|null} [gameToken] MatchCreated gameToken
             * @property {Array.<Uint8Array>|null} [playerTokens] MatchCreated playerTokens
             */

            /**
             * Constructs a new MatchCreated.
             * @memberof mozaic.client_server
             * @classdesc Represents a MatchCreated.
             * @implements IMatchCreated
             * @constructor
             * @param {mozaic.client_server.IMatchCreated=} [properties] Properties to set
             */
            function MatchCreated(properties) {
                this.playerTokens = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MatchCreated gameToken.
             * @member {Uint8Array} gameToken
             * @memberof mozaic.client_server.MatchCreated
             * @instance
             */
            MatchCreated.prototype.gameToken = $util.newBuffer([]);

            /**
             * MatchCreated playerTokens.
             * @member {Array.<Uint8Array>} playerTokens
             * @memberof mozaic.client_server.MatchCreated
             * @instance
             */
            MatchCreated.prototype.playerTokens = $util.emptyArray;

            /**
             * Creates a new MatchCreated instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {mozaic.client_server.IMatchCreated=} [properties] Properties to set
             * @returns {mozaic.client_server.MatchCreated} MatchCreated instance
             */
            MatchCreated.create = function create(properties) {
                return new MatchCreated(properties);
            };

            /**
             * Encodes the specified MatchCreated message. Does not implicitly {@link mozaic.client_server.MatchCreated.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {mozaic.client_server.IMatchCreated} message MatchCreated message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MatchCreated.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.playerTokens != null && message.playerTokens.length)
                    for (var i = 0; i < message.playerTokens.length; ++i)
                        writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.playerTokens[i]);
                if (message.gameToken != null && message.hasOwnProperty("gameToken"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.gameToken);
                return writer;
            };

            /**
             * Encodes the specified MatchCreated message, length delimited. Does not implicitly {@link mozaic.client_server.MatchCreated.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {mozaic.client_server.IMatchCreated} message MatchCreated message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MatchCreated.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MatchCreated message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.MatchCreated} MatchCreated
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MatchCreated.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.MatchCreated();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 2:
                        message.gameToken = reader.bytes();
                        break;
                    case 1:
                        if (!(message.playerTokens && message.playerTokens.length))
                            message.playerTokens = [];
                        message.playerTokens.push(reader.bytes());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MatchCreated message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.MatchCreated} MatchCreated
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MatchCreated.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MatchCreated message.
             * @function verify
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MatchCreated.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.gameToken != null && message.hasOwnProperty("gameToken"))
                    if (!(message.gameToken && typeof message.gameToken.length === "number" || $util.isString(message.gameToken)))
                        return "gameToken: buffer expected";
                if (message.playerTokens != null && message.hasOwnProperty("playerTokens")) {
                    if (!Array.isArray(message.playerTokens))
                        return "playerTokens: array expected";
                    for (var i = 0; i < message.playerTokens.length; ++i)
                        if (!(message.playerTokens[i] && typeof message.playerTokens[i].length === "number" || $util.isString(message.playerTokens[i])))
                            return "playerTokens: buffer[] expected";
                }
                return null;
            };

            /**
             * Creates a MatchCreated message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.MatchCreated} MatchCreated
             */
            MatchCreated.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.MatchCreated)
                    return object;
                var message = new $root.mozaic.client_server.MatchCreated();
                if (object.gameToken != null)
                    if (typeof object.gameToken === "string")
                        $util.base64.decode(object.gameToken, message.gameToken = $util.newBuffer($util.base64.length(object.gameToken)), 0);
                    else if (object.gameToken.length)
                        message.gameToken = object.gameToken;
                if (object.playerTokens) {
                    if (!Array.isArray(object.playerTokens))
                        throw TypeError(".mozaic.client_server.MatchCreated.playerTokens: array expected");
                    message.playerTokens = [];
                    for (var i = 0; i < object.playerTokens.length; ++i)
                        if (typeof object.playerTokens[i] === "string")
                            $util.base64.decode(object.playerTokens[i], message.playerTokens[i] = $util.newBuffer($util.base64.length(object.playerTokens[i])), 0);
                        else if (object.playerTokens[i].length)
                            message.playerTokens[i] = object.playerTokens[i];
                }
                return message;
            };

            /**
             * Creates a plain object from a MatchCreated message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.MatchCreated
             * @static
             * @param {mozaic.client_server.MatchCreated} message MatchCreated
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MatchCreated.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.playerTokens = [];
                if (options.defaults)
                    object.gameToken = options.bytes === String ? "" : [];
                if (message.playerTokens && message.playerTokens.length) {
                    object.playerTokens = [];
                    for (var j = 0; j < message.playerTokens.length; ++j)
                        object.playerTokens[j] = options.bytes === String ? $util.base64.encode(message.playerTokens[j], 0, message.playerTokens[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.playerTokens[j]) : message.playerTokens[j];
                }
                if (message.gameToken != null && message.hasOwnProperty("gameToken"))
                    object.gameToken = options.bytes === String ? $util.base64.encode(message.gameToken, 0, message.gameToken.length) : options.bytes === Array ? Array.prototype.slice.call(message.gameToken) : message.gameToken;
                return object;
            };

            /**
             * Converts this MatchCreated to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.MatchCreated
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MatchCreated.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return MatchCreated;
        })();

        client_server.Connect = (function() {

            /**
             * Properties of a Connect.
             * @memberof mozaic.client_server
             * @interface IConnect
             * @property {Uint8Array|null} [token] Connect token
             */

            /**
             * Constructs a new Connect.
             * @memberof mozaic.client_server
             * @classdesc Represents a Connect.
             * @implements IConnect
             * @constructor
             * @param {mozaic.client_server.IConnect=} [properties] Properties to set
             */
            function Connect(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Connect token.
             * @member {Uint8Array} token
             * @memberof mozaic.client_server.Connect
             * @instance
             */
            Connect.prototype.token = $util.newBuffer([]);

            /**
             * Creates a new Connect instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {mozaic.client_server.IConnect=} [properties] Properties to set
             * @returns {mozaic.client_server.Connect} Connect instance
             */
            Connect.create = function create(properties) {
                return new Connect(properties);
            };

            /**
             * Encodes the specified Connect message. Does not implicitly {@link mozaic.client_server.Connect.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {mozaic.client_server.IConnect} message Connect message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Connect.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.token != null && message.hasOwnProperty("token"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.token);
                return writer;
            };

            /**
             * Encodes the specified Connect message, length delimited. Does not implicitly {@link mozaic.client_server.Connect.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {mozaic.client_server.IConnect} message Connect message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Connect.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Connect message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.Connect} Connect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Connect.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.Connect();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.token = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Connect message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.Connect} Connect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Connect.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Connect message.
             * @function verify
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Connect.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.token != null && message.hasOwnProperty("token"))
                    if (!(message.token && typeof message.token.length === "number" || $util.isString(message.token)))
                        return "token: buffer expected";
                return null;
            };

            /**
             * Creates a Connect message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.Connect} Connect
             */
            Connect.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.Connect)
                    return object;
                var message = new $root.mozaic.client_server.Connect();
                if (object.token != null)
                    if (typeof object.token === "string")
                        $util.base64.decode(object.token, message.token = $util.newBuffer($util.base64.length(object.token)), 0);
                    else if (object.token.length)
                        message.token = object.token;
                return message;
            };

            /**
             * Creates a plain object from a Connect message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.Connect
             * @static
             * @param {mozaic.client_server.Connect} message Connect
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Connect.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.token = options.bytes === String ? "" : [];
                if (message.token != null && message.hasOwnProperty("token"))
                    object.token = options.bytes === String ? $util.base64.encode(message.token, 0, message.token.length) : options.bytes === Array ? Array.prototype.slice.call(message.token) : message.token;
                return object;
            };

            /**
             * Converts this Connect to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.Connect
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Connect.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Connect;
        })();

        client_server.ConnectResponse = (function() {

            /**
             * Properties of a ConnectResponse.
             * @memberof mozaic.client_server
             * @interface IConnectResponse
             * @property {mozaic.client_server.IConnected|null} [connected] ConnectResponse connected
             * @property {string|null} [error] ConnectResponse error
             */

            /**
             * Constructs a new ConnectResponse.
             * @memberof mozaic.client_server
             * @classdesc Represents a ConnectResponse.
             * @implements IConnectResponse
             * @constructor
             * @param {mozaic.client_server.IConnectResponse=} [properties] Properties to set
             */
            function ConnectResponse(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConnectResponse connected.
             * @member {mozaic.client_server.IConnected|null|undefined} connected
             * @memberof mozaic.client_server.ConnectResponse
             * @instance
             */
            ConnectResponse.prototype.connected = null;

            /**
             * ConnectResponse error.
             * @member {string} error
             * @memberof mozaic.client_server.ConnectResponse
             * @instance
             */
            ConnectResponse.prototype.error = "";

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * ConnectResponse response.
             * @member {"connected"|"error"|undefined} response
             * @memberof mozaic.client_server.ConnectResponse
             * @instance
             */
            Object.defineProperty(ConnectResponse.prototype, "response", {
                get: $util.oneOfGetter($oneOfFields = ["connected", "error"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ConnectResponse instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {mozaic.client_server.IConnectResponse=} [properties] Properties to set
             * @returns {mozaic.client_server.ConnectResponse} ConnectResponse instance
             */
            ConnectResponse.create = function create(properties) {
                return new ConnectResponse(properties);
            };

            /**
             * Encodes the specified ConnectResponse message. Does not implicitly {@link mozaic.client_server.ConnectResponse.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {mozaic.client_server.IConnectResponse} message ConnectResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConnectResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.connected != null && message.hasOwnProperty("connected"))
                    $root.mozaic.client_server.Connected.encode(message.connected, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.error != null && message.hasOwnProperty("error"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.error);
                return writer;
            };

            /**
             * Encodes the specified ConnectResponse message, length delimited. Does not implicitly {@link mozaic.client_server.ConnectResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {mozaic.client_server.IConnectResponse} message ConnectResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConnectResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ConnectResponse message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.ConnectResponse} ConnectResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConnectResponse.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.ConnectResponse();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.connected = $root.mozaic.client_server.Connected.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.error = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ConnectResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.ConnectResponse} ConnectResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConnectResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConnectResponse message.
             * @function verify
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConnectResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.connected != null && message.hasOwnProperty("connected")) {
                    properties.response = 1;
                    {
                        var error = $root.mozaic.client_server.Connected.verify(message.connected);
                        if (error)
                            return "connected." + error;
                    }
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    if (properties.response === 1)
                        return "response: multiple values";
                    properties.response = 1;
                    if (!$util.isString(message.error))
                        return "error: string expected";
                }
                return null;
            };

            /**
             * Creates a ConnectResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.ConnectResponse} ConnectResponse
             */
            ConnectResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.ConnectResponse)
                    return object;
                var message = new $root.mozaic.client_server.ConnectResponse();
                if (object.connected != null) {
                    if (typeof object.connected !== "object")
                        throw TypeError(".mozaic.client_server.ConnectResponse.connected: object expected");
                    message.connected = $root.mozaic.client_server.Connected.fromObject(object.connected);
                }
                if (object.error != null)
                    message.error = String(object.error);
                return message;
            };

            /**
             * Creates a plain object from a ConnectResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.ConnectResponse
             * @static
             * @param {mozaic.client_server.ConnectResponse} message ConnectResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConnectResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.connected != null && message.hasOwnProperty("connected")) {
                    object.connected = $root.mozaic.client_server.Connected.toObject(message.connected, options);
                    if (options.oneofs)
                        object.response = "connected";
                }
                if (message.error != null && message.hasOwnProperty("error")) {
                    object.error = message.error;
                    if (options.oneofs)
                        object.response = "error";
                }
                return object;
            };

            /**
             * Converts this ConnectResponse to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.ConnectResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConnectResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ConnectResponse;
        })();

        client_server.Connected = (function() {

            /**
             * Properties of a Connected.
             * @memberof mozaic.client_server
             * @interface IConnected
             */

            /**
             * Constructs a new Connected.
             * @memberof mozaic.client_server
             * @classdesc Represents a Connected.
             * @implements IConnected
             * @constructor
             * @param {mozaic.client_server.IConnected=} [properties] Properties to set
             */
            function Connected(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new Connected instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {mozaic.client_server.IConnected=} [properties] Properties to set
             * @returns {mozaic.client_server.Connected} Connected instance
             */
            Connected.create = function create(properties) {
                return new Connected(properties);
            };

            /**
             * Encodes the specified Connected message. Does not implicitly {@link mozaic.client_server.Connected.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {mozaic.client_server.IConnected} message Connected message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Connected.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified Connected message, length delimited. Does not implicitly {@link mozaic.client_server.Connected.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {mozaic.client_server.IConnected} message Connected message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Connected.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Connected message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.Connected} Connected
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Connected.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.Connected();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Connected message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.Connected} Connected
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Connected.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Connected message.
             * @function verify
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Connected.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a Connected message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.Connected} Connected
             */
            Connected.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.Connected)
                    return object;
                return new $root.mozaic.client_server.Connected();
            };

            /**
             * Creates a plain object from a Connected message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.Connected
             * @static
             * @param {mozaic.client_server.Connected} message Connected
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Connected.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this Connected to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.Connected
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Connected.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Connected;
        })();

        client_server.ClientMessage = (function() {

            /**
             * Properties of a ClientMessage.
             * @memberof mozaic.client_server
             * @interface IClientMessage
             * @property {mozaic.client_server.IGameData|null} [gameData] ClientMessage gameData
             * @property {mozaic.client_server.IDisconnect|null} [disconnect] ClientMessage disconnect
             */

            /**
             * Constructs a new ClientMessage.
             * @memberof mozaic.client_server
             * @classdesc Represents a ClientMessage.
             * @implements IClientMessage
             * @constructor
             * @param {mozaic.client_server.IClientMessage=} [properties] Properties to set
             */
            function ClientMessage(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ClientMessage gameData.
             * @member {mozaic.client_server.IGameData|null|undefined} gameData
             * @memberof mozaic.client_server.ClientMessage
             * @instance
             */
            ClientMessage.prototype.gameData = null;

            /**
             * ClientMessage disconnect.
             * @member {mozaic.client_server.IDisconnect|null|undefined} disconnect
             * @memberof mozaic.client_server.ClientMessage
             * @instance
             */
            ClientMessage.prototype.disconnect = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * ClientMessage message.
             * @member {"gameData"|"disconnect"|undefined} message
             * @memberof mozaic.client_server.ClientMessage
             * @instance
             */
            Object.defineProperty(ClientMessage.prototype, "message", {
                get: $util.oneOfGetter($oneOfFields = ["gameData", "disconnect"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ClientMessage instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {mozaic.client_server.IClientMessage=} [properties] Properties to set
             * @returns {mozaic.client_server.ClientMessage} ClientMessage instance
             */
            ClientMessage.create = function create(properties) {
                return new ClientMessage(properties);
            };

            /**
             * Encodes the specified ClientMessage message. Does not implicitly {@link mozaic.client_server.ClientMessage.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {mozaic.client_server.IClientMessage} message ClientMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.gameData != null && message.hasOwnProperty("gameData"))
                    $root.mozaic.client_server.GameData.encode(message.gameData, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.disconnect != null && message.hasOwnProperty("disconnect"))
                    $root.mozaic.client_server.Disconnect.encode(message.disconnect, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ClientMessage message, length delimited. Does not implicitly {@link mozaic.client_server.ClientMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {mozaic.client_server.IClientMessage} message ClientMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ClientMessage message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.ClientMessage} ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMessage.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.ClientMessage();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.gameData = $root.mozaic.client_server.GameData.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.disconnect = $root.mozaic.client_server.Disconnect.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ClientMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.ClientMessage} ClientMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ClientMessage message.
             * @function verify
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ClientMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.gameData != null && message.hasOwnProperty("gameData")) {
                    properties.message = 1;
                    {
                        var error = $root.mozaic.client_server.GameData.verify(message.gameData);
                        if (error)
                            return "gameData." + error;
                    }
                }
                if (message.disconnect != null && message.hasOwnProperty("disconnect")) {
                    if (properties.message === 1)
                        return "message: multiple values";
                    properties.message = 1;
                    {
                        var error = $root.mozaic.client_server.Disconnect.verify(message.disconnect);
                        if (error)
                            return "disconnect." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ClientMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.ClientMessage} ClientMessage
             */
            ClientMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.ClientMessage)
                    return object;
                var message = new $root.mozaic.client_server.ClientMessage();
                if (object.gameData != null) {
                    if (typeof object.gameData !== "object")
                        throw TypeError(".mozaic.client_server.ClientMessage.gameData: object expected");
                    message.gameData = $root.mozaic.client_server.GameData.fromObject(object.gameData);
                }
                if (object.disconnect != null) {
                    if (typeof object.disconnect !== "object")
                        throw TypeError(".mozaic.client_server.ClientMessage.disconnect: object expected");
                    message.disconnect = $root.mozaic.client_server.Disconnect.fromObject(object.disconnect);
                }
                return message;
            };

            /**
             * Creates a plain object from a ClientMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.ClientMessage
             * @static
             * @param {mozaic.client_server.ClientMessage} message ClientMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ClientMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.gameData != null && message.hasOwnProperty("gameData")) {
                    object.gameData = $root.mozaic.client_server.GameData.toObject(message.gameData, options);
                    if (options.oneofs)
                        object.message = "gameData";
                }
                if (message.disconnect != null && message.hasOwnProperty("disconnect")) {
                    object.disconnect = $root.mozaic.client_server.Disconnect.toObject(message.disconnect, options);
                    if (options.oneofs)
                        object.message = "disconnect";
                }
                return object;
            };

            /**
             * Converts this ClientMessage to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.ClientMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ClientMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ClientMessage;
        })();

        client_server.GameData = (function() {

            /**
             * Properties of a GameData.
             * @memberof mozaic.client_server
             * @interface IGameData
             * @property {Uint8Array|null} [data] GameData data
             */

            /**
             * Constructs a new GameData.
             * @memberof mozaic.client_server
             * @classdesc Represents a GameData.
             * @implements IGameData
             * @constructor
             * @param {mozaic.client_server.IGameData=} [properties] Properties to set
             */
            function GameData(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GameData data.
             * @member {Uint8Array} data
             * @memberof mozaic.client_server.GameData
             * @instance
             */
            GameData.prototype.data = $util.newBuffer([]);

            /**
             * Creates a new GameData instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {mozaic.client_server.IGameData=} [properties] Properties to set
             * @returns {mozaic.client_server.GameData} GameData instance
             */
            GameData.create = function create(properties) {
                return new GameData(properties);
            };

            /**
             * Encodes the specified GameData message. Does not implicitly {@link mozaic.client_server.GameData.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {mozaic.client_server.IGameData} message GameData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GameData.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.data != null && message.hasOwnProperty("data"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.data);
                return writer;
            };

            /**
             * Encodes the specified GameData message, length delimited. Does not implicitly {@link mozaic.client_server.GameData.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {mozaic.client_server.IGameData} message GameData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GameData.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GameData message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.GameData} GameData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GameData.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.GameData();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.data = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GameData message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.GameData} GameData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GameData.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GameData message.
             * @function verify
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GameData.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.data != null && message.hasOwnProperty("data"))
                    if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                        return "data: buffer expected";
                return null;
            };

            /**
             * Creates a GameData message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.GameData} GameData
             */
            GameData.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.GameData)
                    return object;
                var message = new $root.mozaic.client_server.GameData();
                if (object.data != null)
                    if (typeof object.data === "string")
                        $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                    else if (object.data.length)
                        message.data = object.data;
                return message;
            };

            /**
             * Creates a plain object from a GameData message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.GameData
             * @static
             * @param {mozaic.client_server.GameData} message GameData
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GameData.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.data = options.bytes === String ? "" : [];
                if (message.data != null && message.hasOwnProperty("data"))
                    object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
                return object;
            };

            /**
             * Converts this GameData to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.GameData
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GameData.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return GameData;
        })();

        client_server.Disconnect = (function() {

            /**
             * Properties of a Disconnect.
             * @memberof mozaic.client_server
             * @interface IDisconnect
             */

            /**
             * Constructs a new Disconnect.
             * @memberof mozaic.client_server
             * @classdesc Represents a Disconnect.
             * @implements IDisconnect
             * @constructor
             * @param {mozaic.client_server.IDisconnect=} [properties] Properties to set
             */
            function Disconnect(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Creates a new Disconnect instance using the specified properties.
             * @function create
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {mozaic.client_server.IDisconnect=} [properties] Properties to set
             * @returns {mozaic.client_server.Disconnect} Disconnect instance
             */
            Disconnect.create = function create(properties) {
                return new Disconnect(properties);
            };

            /**
             * Encodes the specified Disconnect message. Does not implicitly {@link mozaic.client_server.Disconnect.verify|verify} messages.
             * @function encode
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {mozaic.client_server.IDisconnect} message Disconnect message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Disconnect.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                return writer;
            };

            /**
             * Encodes the specified Disconnect message, length delimited. Does not implicitly {@link mozaic.client_server.Disconnect.verify|verify} messages.
             * @function encodeDelimited
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {mozaic.client_server.IDisconnect} message Disconnect message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Disconnect.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Disconnect message from the specified reader or buffer.
             * @function decode
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {mozaic.client_server.Disconnect} Disconnect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Disconnect.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.mozaic.client_server.Disconnect();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Disconnect message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {mozaic.client_server.Disconnect} Disconnect
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Disconnect.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Disconnect message.
             * @function verify
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Disconnect.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                return null;
            };

            /**
             * Creates a Disconnect message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {mozaic.client_server.Disconnect} Disconnect
             */
            Disconnect.fromObject = function fromObject(object) {
                if (object instanceof $root.mozaic.client_server.Disconnect)
                    return object;
                return new $root.mozaic.client_server.Disconnect();
            };

            /**
             * Creates a plain object from a Disconnect message. Also converts values to other types if specified.
             * @function toObject
             * @memberof mozaic.client_server.Disconnect
             * @static
             * @param {mozaic.client_server.Disconnect} message Disconnect
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Disconnect.toObject = function toObject() {
                return {};
            };

            /**
             * Converts this Disconnect to JSON.
             * @function toJSON
             * @memberof mozaic.client_server.Disconnect
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Disconnect.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Disconnect;
        })();

        return client_server;
    })();

    return mozaic;
})();

module.exports = $root;
