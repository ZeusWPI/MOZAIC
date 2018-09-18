const merge = require('webpack-merge');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const parts = require('./webpack.parts');
const commonConfig = require('./webpack.common.config');
const projConf = require('./project.config');

const productionConfig = merge([
  {
    name: 'client',
    entry: {
      main: projConf.inProjectSrc(projConf.main),
    },
  },
  parts.outputPath(),
  parts.extractCSS(),
  parts.setFreeVariable('__DEV__', false),
  parts.clean(projConf.PATHS.build, projConf.baseDir),
  {
    plugins: [
      new HTMLWebpackPlugin({
        title: 'Mozaic Blockly',
        template: projConf.inProjectSrc('index.html'),
      }),
    ],
  },
]);

const developmentConfig = merge([
  {
    name: 'client',
    entry: {
      main: projConf.inProjectSrc(projConf.main),
    },
    devtool: 'eval-source-map',
  },

  parts.outputPath(),
  parts.loadCSS({ useStyleLoader: true }),
  {
    serve: {
      port: 4000,
    },
  },
  parts.setFreeVariable('__DEV__', true),
  {
    plugins: [
      new HTMLWebpackPlugin({
        title: 'Mozaic Blockly',
        template: projConf.inProjectSrc('index.html'),
      }),
    ],
  },
]);

module.exports = mode => {
  const myMode = process.env.WEBPACK_SERVE ? 'development' : mode;

  const config = myMode === 'production' ? productionConfig : developmentConfig;
  return merge(commonConfig, config, { mode: myMode });
};
