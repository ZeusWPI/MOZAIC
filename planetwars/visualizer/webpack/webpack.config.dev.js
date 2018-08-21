const path = require('path');

const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./webpack.config.base');

module.exports = merge(baseConfig, {
    entry: ['./bin/index'],
    mode: 'development',
    watch: true,
    plugins: [
        // For the test index.html
        new CopyWebpackPlugin([{
            from: '../*.html'
        }])
    ],
    devtool: "source-map",
    devServer: {
      contentBase: path.join(__dirname, '..'),
      port: 9000
    },
});