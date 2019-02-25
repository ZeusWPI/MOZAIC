@0xd61dd42467f93e49;

using Core = import "core.capnp";

struct NetworkMessage {
    typeId @0: UInt64;
    data @1: AnyPointer;
}

struct Publish {
    message @0: Data;
}

struct Connect {
    id @0: Data;
}

struct Connected {
    id @0: Data;
}