const path = require('path');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].css"
})

module.exports = {
  entry: ["./src/standalone_main.js", "./src/assets/style/main.scss"],
  output: {
    library: "planetwars_visualizer",
    path: __dirname + '/app/',
    filename: "index.js",
    sourceMapFilename: "index.js.map"
  },
  devtool: 'sourcemap',
  resolveLoader: {
    modules: [
      path.join(__dirname, 'node_modules')
    ]
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: extractSass.extract({
        use: [{
          loader: "css-loader"
        }, {
          loader: "sass-loader"
        }]
      }), 
    }, {
      test: /\.(jpe|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
      loader: 'file-loader',
    }]
  },
  plugins: [
    extractSass
  ]
};