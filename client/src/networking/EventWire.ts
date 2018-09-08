export interface Address {
    host: string;
    port: number;
}

export interface ClientParams {
    host: string;
    port: number;
    token: Uint8Array;
}


export interface WireEvent {
    typeId: number,
    data: Uint8Array,
}
