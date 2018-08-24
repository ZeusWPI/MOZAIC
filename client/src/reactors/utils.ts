import { WireEvent } from "../networking/EventWire";

export function encodeEvent(event: any): WireEvent {
    let eventType = event.constructor as any;
    let typeId = eventType.typeId;
    if (!typeId) {
        throw "invalid event";
    }
    let data = eventType.encode(event).finish();
    return { typeId, data };
}