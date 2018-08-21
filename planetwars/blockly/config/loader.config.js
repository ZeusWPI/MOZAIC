const projConf = require('./project.config');

exports.cssLoaderOptions = (sourcemap = true) => ({
  sourceMap: true,
  modules: true,
  localIdentName: '[local]-[hash:base64:4]',
  minimize: {
    autoprefixer: {
      add: true,
      remove: true,
    },
    discardComments: {
      removeAll: true,
    },
    discardUnused: false,
    mergeIdents: false,
    reduceIdents: false,
    safe: true,
    sourcemap,
  },
});

exports.sassLoaderOptions = ({
  sourceMap = true,
  includePaths = [projConf.inProjectSrc('styles')],
} = {}) => ({
  sourceMap,
  includePaths,
});
