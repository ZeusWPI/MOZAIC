# Redux Saga

**Prerequisite:** know Redux (actions, store, dispatching, ...)

[Docs](https://redux-saga.js.org/docs/)

Redux saga is a middleware between an application and redux store, that is
handled by redux actions. This means it can listen to actions, intercept
actions it is interested in, and replace them with other actions. This may
be useful for plenty of things. In particular, using sagas you can keep your
components as simple as possible and move all the logic to sagas.

It's recommended to take your time going trough the docs, you should at least be familiar with the [basic concepts](https://redux-saga.js.org/docs/basics/). In particular, it's useful to look at the effect creators in [the api docs](https://redux-saga.js.org/docs/api/).

You don't need to know these in detail for understanding the code. For modifying it, it's somewhat more required.