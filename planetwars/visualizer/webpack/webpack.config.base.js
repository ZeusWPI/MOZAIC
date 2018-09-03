const path = require('path');

module.exports = {
  output: {
    filename: 'index.js',
    path: path.join(__dirname, '../dist'),
    library: 'visualizer',
    libraryTarget: 'umd',
    publicPath: '/lib/',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      'assets': path.resolve(__dirname, 'assets')
    }
  },
  module: {
    rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
          loader: 'url-loader',
          options: {
            fallback: "file-loader",
            name: "[name][md5:hash].[ext]",
            outputPath: 'assets/',
            publicPath: '/assets/'
          }
        }]
      },
    ]
  },
};