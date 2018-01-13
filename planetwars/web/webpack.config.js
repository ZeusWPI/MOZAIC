const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './frontend/index.js',
  output: { path: 'dist/', filename: 'bundle.js' },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
};