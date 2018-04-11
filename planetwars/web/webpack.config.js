const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname, 'frontend'),
  entry: './index.ts',
  output: { path: path.join(__dirname, "dist/"), filename: 'bundle.js' },
  devtool: 'source-map',
  // https://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    modules: [
      path.join(__dirname, 'frontend'),
      'node_modules',
    ]
  },

  watchOptions: {
    poll: true
  },

  module: {
    loaders: [
      {
        test: /.tsx?$/,
        loaders: [
          { 
            loader: 'ts-loader',
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(?:svg|ttf|otf|eot|woff2|woff)(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'image/svg+xml',
          }
        }
      },
      // Favicon & statics
      {
        test: /.$/,
        include: [
          path.resolve(__dirname, 'frontend/static/favicon/')
        ],
        use: {
          loader: 'file-loader',
          options: { name: '[name].[ext]' }
        }
      },
      // Common Image Formats
      {
        test: /\.(?:|gif|png|jpg|jpeg|webp)$/,
        exclude: [
          path.resolve(__dirname, 'frontend/static/favicon/')
        ],
        use: {
          loader: 'file-loader',
          options: { 
            name: '[path][name].[ext]'
          }
        }
      }
    ]
  },
};
