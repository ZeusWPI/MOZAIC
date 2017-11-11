# PlanetWars Client

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

## TODO

- Add info about tech stack
- Check need for `concurrently`
- Check need for `css-loader-require-hook`
- Check package.json scripts
- TSX to Hyperscript
- Check package.json build
- Check need for `asar`
- Add `npm install -g cross-env` somewhere
