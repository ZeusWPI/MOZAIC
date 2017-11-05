const path = require('path');

module.exports = {
  entry: "./src/app.js",
  output: {
    path: __dirname + '/app/',
    filename: "bundle.js",
    sourceMapFilename: "bundle.js.map"
  },
  devtool: 'sourcemap',
  resolveLoader: {
    modules: [
      path.join(__dirname, 'node_modules')
    ]
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" }
    ]
  }
};
