/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
const projConf = require('./project.config');
const parts = require('./webpack.parts');

module.exports = merge([
  parts.loadJavaScript({
    include: [projConf.PATHS.app],
  }),
  parts.loadFonts(),
  parts.modulePathResolve(projConf.PATHS.app),
  parts.loadImages(),
]);
