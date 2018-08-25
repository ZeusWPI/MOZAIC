import { WireEvent } from "../networking/EventWire";

// TODO: how can we type events?
// For easy interop with redux, a discriminated union type would be nice,
// but this might not be the best solution for anything not redux.
// We currently kind of treat events as a tagged union, by using the constructor
// as a tag, which is kind of hacky and won't work with any debug tools
// (function pointers are not ideal for serialization).
// We do have typings for all individual event types, generated from the
// protobuf declaration. How can we integrate those?
// Maybe we want to use an adapter for use with redux?

export function encodeEvent(event: any): WireEvent {
    let eventType = event.constructor as any;
    let typeId = eventType.typeId;
    if (!typeId) {
        throw "invalid event";
    }
    let data = eventType.encode(event).finish();
    return { typeId, data };
}