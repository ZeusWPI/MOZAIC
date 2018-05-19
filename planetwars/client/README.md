# PlanetWars Client

## How to get started

This project contains quite some advanced libraries and technologies,
but there's no need to be daunted. When you now the entry points, and have a
limited understanding of some off the core tech (React & Redux), you'll be off
in no time.

Be sure to ask the devs to help you get started. Also have a look at our docs,
and maybe do some quick tutorials on React, Redux, or TypeScript.

## Setup

Should work on Linux, macOS, and Windows.

- Clone this repo
- run `npm install`
- run `npm run dev`

When running in dev-mode, hot-reloading is enabled, so
updating code, you can just refresh your Electron app (with F5 for example),
instead of running de `npm run dev` command again.

### Notes

Project setup is taken from [here](https://github.com/iRath96/electron-react-typescript-boilerplate),
so you might find more info on problems there.

If you are using WSL, I suggest installing Node and NPM on Windows,
and running the NPM commands from there. All tools seem to be supported very well.

Might help to install electron and cross-env globally with NPM with
`npm install -g electron` and `npm install -g cross-dev` respectively.

### Publishing

If you want to package and publish new versions of the client, check out [electron-builder](https://www.electron.build/multi-platform-build) for more info. You will only be able to build for macOS on macOS. Windows can work with Wine.

This section will still be updated.
