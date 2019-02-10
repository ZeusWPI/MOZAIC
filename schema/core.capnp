@0xad560d3d7666face;

struct Uuid {
    x0 @0: UInt64;
    x1 @1: UInt64;
}

struct MozaicMessage {
    sender @0: Uuid;
    receiver @1: Uuid;
    typeId @2: UInt64;
    payload @3: AnyPointer; 
}

struct TerminateStream {}

struct Initialize {}

struct Message {
    typeId @0: UInt64;
    data @1: AnyPointer;
}

struct GreetPerson {
    personName @0: Text;
}