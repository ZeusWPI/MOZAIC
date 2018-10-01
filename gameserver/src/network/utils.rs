use prost::Message;

pub enum Step<State, Next> {
    NotReady(State),
    Ready(Next),
}

impl<State, Next> Step<State, Next> {
    fn map_not_ready<F, R>(self, fun: F) -> Step<R, Next>
        where F: FnOnce(State) -> R
    {
        match self {
            Step::Ready(next) => Step::Ready(next),
            Step::NotReady(state) => Step::NotReady(fun(state)),
        }
    }
}

#[macro_export]
macro_rules! try_ready_or {
    ($default:expr, $e:expr) => (
        match $e {
            Err(err) => return Err(err),
            Ok(Async::NotReady) => return Ok(Step::NotReady($default)),
            Ok(Async::Ready(item)) => item,
        }
    );
}

#[macro_export]
macro_rules! try_step {
    ($e:expr) => (
        match $e.step() {
            Err(err) => Err(err),
            Ok(Step::Ready(state)) => Ok(Step::Ready(state.into())),
            Ok(Step::NotReady(state)) => Ok(Step::NotReady(state.into())),
        }
    )
}

pub fn encode_protobuf<M>(message: &M) -> Vec<u8>
    where M: Message
{
    let mut buffer = Vec::with_capacity(message.encoded_len());
    // encode will only fail when insufficient space is allocated, but we
    // just allocated the exact right amount of space.
    message.encode(&mut buffer).unwrap();

    return buffer;
}