@0xad560d3d7666face;

struct Message {
    typeId @0: UInt64;
    data @1: AnyPointer;
}

struct GreetPerson {
    personName @0: Text;
}