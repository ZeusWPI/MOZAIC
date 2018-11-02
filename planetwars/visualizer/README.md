# Planetwars Visualiser

This repository is a visualiser for the Planetwars game as a React component in an NPM package. You should be able to import this package and use the library as any other component.

You can pass an `assetPrefix` prop that affects where the assets should be loaded from. Depending on your build process, you might have to copy them, or include a prefix to their path in `node_modules`.

Example: `path.resolve('.', 'node_modules', 'planetwars-visualizer')`

Example: `path.resolve(appPath, 'node_modules', 'planetwars-visualizer')` where appPath is something that depends on whether it's a dev or production run.

## Development

You can test this module with the code in the `bin` directory, which you can run with `yarn run dev`. This will spawn a webpack dev server which serves a basic wrapper around the visualizer which lets you upload a logfile.

## TODO

- Add color props
- Find a way to emit Sass (while sill supporting modules)