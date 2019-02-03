const TypeDocPlugin = require('typedoc-webpack-plugin');

const { DOCS_FOLDER } = require('./path_config');


module.exports = {
  mode: 'development',

  plugins: [
    new TypeDocPlugin({
      out: DOCS_FOLDER,
      jsx: true,
      mode: 'file',
      tsconfig: 'tsconfig.json',
      ignoreCompilerErrors: true,
      verbose: true,
      plugin: [
        'typedoc-plugin-external-module-name'
      ]
    })
  ],
};