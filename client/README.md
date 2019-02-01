# mozaic-client

Common library for interactions with the game server. All game clients should use this instead of communicating directly with the gameserver.

## Building
1. `yarn install`
2. `yarn build`

You should also link this library for use in other projects with ```yarn link```

## Docs

We use [typedoc][1] for in-code documentation. It understands typescript, so stick to semantic documentation, things like types and structure are generated automatically.

Generate the docs by running `yarn typedoc --out docs/`
Once generated you can open the index.html file in your browser to view them.

[1]: https://typedoc.org/