const path = require('path');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].css"
})

module.exports = {
  entry: ["./src/standalone_main.js"],
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
    loaders: [
      {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          use: [{
            loader: 'css-loader',
            options: {
              //modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]',
            }
          },
          {
            loader: 'sass-loader'
          }]
        })
      },
      {
        test: /\.(jpe|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        loader: 'file-loader',
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
  ]
};