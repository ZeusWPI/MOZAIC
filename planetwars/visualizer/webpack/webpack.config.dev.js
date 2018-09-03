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
        port: 8080
    },
    module: {
        rules: [{
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
        ]
    }
});