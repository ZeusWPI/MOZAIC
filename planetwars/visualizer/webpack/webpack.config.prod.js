const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base');

module.exports = merge(baseConfig, {
    mode: 'production',
    entry: ['./src/index'],
    externals: {
        'react': 'react',
        'react-dom': 'react-dom'
    },
});