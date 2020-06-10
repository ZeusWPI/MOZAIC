# PlanetWars Client

## How to get started

This project contains quite some advanced libraries and technologies,
but there's no need to be daunted. When you know the entry points, and have a
limited understanding of some off the core tech (React & Redux), you'll be off
in no time.

Be sure to ask the devs to help you get started. Also have a look at our docs,
and maybe do some quick tutorials on React, Redux, or TypeScript.

## Setup

Should work on Linux, macOS, and Windows.

- Clone this repo
- run `yarn install`
- run `yarn run dev`

When running in dev-mode, hot-reloading is enabled, so
updating code, you can just refresh your Electron app (with F5 for example),
instead of running de `yarn run dev` command again.

### Notes

Project setup is taken from [here][setup],
so you might find more info on problems there.

If you are using WSL, I suggest installing Node and Yarn on Windows,
and running the Yarn commands from there. All tools seem to be supported very well.

Might help to install electron and cross-env globally with Yarn with
`yarn install -g electron` and `yarn install -g cross-dev` respectively.

### Publishing

If you want to package and publish new versions of the client, check out [electron-builder][electronbuild] for more info. You will only be able to build for macOS on macOS. Windows can work with Wine.

This section will still be updated.

## Docs

We use [typedoc][docs] for in-code documentation. It understands typescript, so stick to semantic documentation, things like types and structure are generated automatically.

The docs are generated when running `yarn run gen-docs`.
They can be found in `dist/docs`. Open the `index.html` file with a browser to view.

NOTE: When adding a doc-comment describing an entire file (= module in typedoc terminology, for our purposes) you need to add an empty doc-comment right after, like so:
```js
/**
* This module contains classes for handling user input.
*/
/** */


/**
* This is a very cool class
*/
class MyClass extends React.Component<MyClassProps>... etc
```

(Technically, all it needs is the first declaration after the module comment to also have a doc-comment. However, this way is less ambiguous.)

[setup]: https://github.com/iRath96/electron-react-typescript-boilerplate
[electronbuild]: https://www.electron.build/multi-platform-build
[docs]: https://typedoc.org/
