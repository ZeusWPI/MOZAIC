/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const child_process = require('child_process');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
    rules: [
      {
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
      },

      // Compile all .global.scss files and pipe it to style.css as is
      {
        test: /\.global\.scss$/,
        use: ['style-loader', 'css-loader?sourceMap', 'sass-loader']
      },
      // Compile all other .scss files and pipe it to style.css
      {
        test: /^((?!\.global).)*\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]',
            }
          },
          'sass-loader',
        ]
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

  output: {
    path: path.join(__dirname, 'app'),
    filename: 'bundle.js',

    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  // https://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      'Styles': path.resolve(__dirname, '..', 'app', 'styles')
    },
    modules: [
      path.join(__dirname, 'app'),
      'node_modules',
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '..', 'app', 'index.html'),
      inject: true,
    }),
    new webpack.DefinePlugin({
      __COMMIT_HASH__: cmdOutput('git rev-parse --short HEAD') || 'unknown_commit',
      __BRANCH_NAME__: cmdOutput('git rev-parse --abbrev-ref HEAD') || 'unknown_branch',
      __TAG__: cmdOutput('git tag --points-at HEAD')
    })
  ],

  externals: Object.keys(externals || {})
};