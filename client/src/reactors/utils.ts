import { WireEvent } from "../networking/EventWire";
import { EventType, Event } from "./SimpleEventEmitter";

// TODO: how can we type events?
// For easy interop with redux, a discriminated union type would be nice,
// but this might not be the best solution for anything not redux.
// We currently kind of treat events as a tagged union, by using the constructor
// as a tag, which is kind of hacky and won't work with any debug tools
// (function pointers are not ideal for serialization).
// We do have typings for all individual event types, generated from the
// protobuf declaration. How can we integrate those?
// Maybe we want to use an adapter for use with redux?

export function encodeEvent(event: Event): WireEvent {
    const typeId = event.eventType.typeId;
    let data = event.eventType.encode(event).finish();
    return { typeId, data };
}

export function tagEvent<E extends Event>(event: E): TaggedEvent<E> {
    return {
        typeId: event.eventType.typeId,
        data: event,
    };
}

// For use with redux and the like.
// TODO: unify this with wire-events.
// TODO: ideally this should be JSON-compatible, meaning it should not rely
// on T being the event class, but rather the associated interface.
export type TaggedEvent<T extends Event> = {
    typeId: T["eventType"]["typeId"],
    data: T,
}
