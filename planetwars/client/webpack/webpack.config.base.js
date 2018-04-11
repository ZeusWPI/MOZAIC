/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const child_process = require('child_process');
const webpack = require('webpack');
const {
  dependencies: externals
} = require('../package.json');

function cmdOutput(cmdString) {
  let output = child_process
    .execSync(cmdString)
    .toString()
    .trim();
  return JSON.stringify(output);
}

module.exports = {
  module: {
    loaders: [{
      test: /\.tsx?$/,
      loaders: ['react-hot-loader/webpack', 'ts-loader'],
      exclude: /node_modules/
    },
    {
        test: /\.tsx?$/,
        enforce: 'pre',
        loader: 'tslint-loader',
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  },

  output: {
    path: path.join(__dirname, 'app'),
    filename: 'bundle.js',

    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  // https://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    modules: [
      path.join(__dirname, 'app'),
      'node_modules',
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      __COMMIT_HASH__: cmdOutput('git rev-parse --short HEAD'),
      __BRANCHNAME__: cmdOutput('git rev-parse --abbrev-ref HEAD')
    })
  ],

  externals: Object.keys(externals || {})
};