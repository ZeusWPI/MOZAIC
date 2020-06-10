/**
 * Setup and run the development server for Hot-Module-Replacement
 * https://webpack.github.io/docs/hot-module-replacement-with-webpack.html
 */

const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const {
  spawn
} = require('child_process');

const config = require('./webpack.config.development');

const argv = require('minimist')(process.argv.slice(2));

const app = express();
const compiler = webpack(config);
const PORT = process.env.PORT || 3000;

const whm = webpackHotMiddleware(compiler);
const wdm = webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  writeToDisk: (filePath) => {
    return /\.html/.test(filePath)
  },
  stats: {
    colors: true
  }
});

app.use(wdm);
app.use(whm);

const server = app.listen(PORT, 'localhost', serverError => {
  if (serverError) {
    return console.error(serverError);
  }

  wdm.waitUntilValid(() => {
    if (argv['start-hot']) {
      spawn('yarn', ['run', 'dev-hot-electron'], {
        shell: true,
        env: process.env,
        stdio: 'inherit'
      })
        .on('close', code => process.exit(code))
        .on('error', spawnError => console.error(spawnError));
    }
  });

  console.log(`Listening at http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Stopping dev server');
  wdm.close();
  server.close(() => {
    process.exit(0);
  });
});