const path = require('path');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractLess = new ExtractTextPlugin({
    filename: "[name].css"
})

module.exports = {
  entry: ["./src/app.js", "./src/assets/style/main.less"],
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
    rules: [{
      test: /\.less$/,
      use: extractLess.extract({
        use: [{
          loader: "css-loader"
        }, {
          loader: "less-loader"
        }]
      }), 
    }, {
      test: /\.(jpe|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
      loader: 'file-loader',
    }]
  },
  plugins: [
    extractLess
  ]
};