const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const {
  peerDependencies: externals
} = require('../package.json');

module.exports = merge(baseConfig, {
  mode: 'production',
  entry: ['./src/index'],

  // https://webpack.js.org/configuration/externals/
  externals: Object.keys(externals || {}),

  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
  module: {
    rules: [{
      test: /(?!fontawesome)\.global\.scss$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader?sourceMap', 'sass-loader']
    },
    {
      test: /^((?!\.global).)*\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'typings-for-css-modules-loader',
          options: {
            modules: true,
            sourceMap: true,
            namedExport: true,
            banner: "// This file is automatically generated by typings-for-css-modules.\n// Please do not change this file!",
            importLoaders: 1,
            localIdentName: '[name]__[local]__[hash:base64:5]',
          }
        },
        'sass-loader',
      ]
    },
    ]
  }
});