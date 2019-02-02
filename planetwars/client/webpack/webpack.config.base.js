/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const child_process = require('child_process');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');

const { APP_FOLDER } = require('./path_config');

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
  // https://webpack.js.org/configuration/externals/
  externals: Object.keys(externals || {}),

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        loader: 'tslint-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },

      // WOFF Font
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader?limit=10000&mimetype=application/font-woff'],
      },
      // WOFF2 Font
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader?limit=10000&mimetype=application/font-woff'],
      },
      // TTF Font
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader?limit=10000&mimetype=application/octet-stream'],
      },
      // EOT Font
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: 'file-loader',
      },
      // SVG Font
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader?limit=10000&mimetype=image/svg+xml'],
      },
      // Common Image Formats
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        use: 'url-loader',
      }]
  },

  // https://webpack.js.org/guides/caching/
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },

  // https://webpack.js.org/configuration/resolve/
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      '@': APP_FOLDER
    },
    modules: [
      APP_FOLDER,
      'node_modules',
    ]
  },

  plugins: [
    // new CleanWebpackPlugin(['dist'], { root: ROOT_FOLDER, beforeEmit: true }),
    new HtmlWebpackPlugin({
      template: path.resolve(APP_FOLDER, 'index.html'),
      inject: true,
    }),
    new webpack.WatchIgnorePlugin([
      /css\.d\.ts$/
    ]),
    new SpeedMeasurePlugin(),
    new webpack.DefinePlugin({
      __COMMIT_HASH__: cmdOutput('git rev-parse --short HEAD') || 'unknown_commit',
      __BRANCH_NAME__: cmdOutput('git rev-parse --abbrev-ref HEAD') || 'unknown_branch',
      __TAG__: cmdOutput('git tag --points-at HEAD')
    })
  ],
};