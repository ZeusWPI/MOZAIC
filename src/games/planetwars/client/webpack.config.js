module.exports = {
  entry: "./app.js",
  output: {
    path: __dirname,
    filename: "bundle.js",
    sourceMapFilename: "bundle.js.map"
  },
  devtool: 'sourcemap',
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" }
    ]
  }
};
