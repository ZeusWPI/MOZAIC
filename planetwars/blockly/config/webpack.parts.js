/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');
const merge = require('webpack-merge');
const loaders = require('./loader.config');
const projConf = require('./project.config');

exports.loadJavaScript = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include,
        exclude,
        use: 'babel-loader',
      },
    ],
  },
});

exports.outputPath = ({
  path = projConf.inProject(projConf.outDir),
  filename = '[name].[hash].js',
  chunkFilename = '[name].[chunkhash].js',
  publicPath = projConf.publicPath,
  libraryTarget = 'umd',
} = {}) => ({
  output: {
    path,
    filename,
    chunkFilename,
    publicPath,
    libraryTarget,
  },
});

exports.clean = (path, root) => ({
  plugins: [
    new CleanWebpackPlugin(path, {
      root,
    }),
  ],
});

exports.loadCSS = ({
  useStyleLoader = false,
  include,
  exclude,
  cssLoaderString = 'css-loader',
  sassLoaderString = 'sass-loader',
} = {}) => ({
  module: {
    rules: [
      {
        test: /\.(css|sass|scss)$/,
        include,
        exclude,
        use: (useStyleLoader ? ['style-loader'] : []).concat([
          {
            loader: cssLoaderString,
            options: loaders.cssLoaderOptions(),
          },
          {
            loader: sassLoaderString,
            options: loaders.sassLoaderOptions(),
          },
        ]),
      },
    ],
  },
});

exports.extractCSS = ({
  include,
  exclude,
  use = [],
  hot = false,
  cssLoaderString = 'css-loader',
  sassLoaderString = 'sass-loader',
} = {}) => {
  const plugin = new ExtractCssChunks({
    filename: 'styles/[name].[chunkhash].css',
    hot,
  });

  return {
    module: {
      rules: [
        {
          test: /\.(css|sass|scss)$/,
          include,
          exclude,

          use: [
            ExtractCssChunks.loader,
            {
              loader: cssLoaderString,
              options: loaders.cssLoaderOptions(),
            },
            {
              loader: sassLoaderString,
              options: loaders.sassLoaderOptions(),
            },
          ].concat(use),
        },
      ],
    },
    plugins: [plugin],
  };
};

exports.setFreeVariable = (key, value) => {
  const env = {};
  env[key] = JSON.stringify(value);

  return {
    plugins: [new webpack.DefinePlugin(env)],
  };
};

const FONTLIST = [
  ['woff', 'application/font-woff'],
  ['woff2', 'application/font-woff2'],
  ['otf', 'font/opentype'],
  ['ttf', 'application/octet-stream'],
  ['eot', 'application/vnd.ms-fontobject'],
  ['svg', 'image/svg+xml'],
];

exports.loadFonts = () => {
  let rsltConf = {
    module: {
      rules: [],
    },
  };

  FONTLIST.forEach(font => {
    const extension = font[0];
    const mimetype = font[1];

    const rule = {
      module: {
        rules: [
          {
            test: new RegExp(`\\.${extension}$`),
            loader: 'url-loader',
            options: {
              name: 'fonts/[name].[ext]',
              limit: 10000,
              mimetype,
            },
          },
        ],
      },
    };
    rsltConf = merge(rsltConf, rule);
  });

  return rsltConf;
};

exports.modulePathResolve = (srcDir = '', nodeDir = 'node_modules') => ({
  resolve: {
    modules: [srcDir, nodeDir],
    extensions: ['*', '.js', '.jsx', '.json'],
  },
});

exports.loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
    ],
  },
});
