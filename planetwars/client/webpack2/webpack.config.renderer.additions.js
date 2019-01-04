/**
 * Base webpack config used across other specific configs
 */
const path = require('path');
const child_process = require('child_process');
const webpack = require('webpack');


function cmdOutput(cmdString) {
  let output = child_process
    .execSync(cmdString)
    .toString()
    .trim();
  return JSON.stringify(output);
}

function log(arg) {
  // console.log(arg);
  return arg;
}
module.exports = {

  // https://webpack.github.io/docs/configuration.html#resolve
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      'Styles': log(path.resolve(__dirname, '..', 'app', 'styles'))
    },
    modules: [
      path.join(__dirname, 'app'),
      'node_modules',
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      __COMMIT_HASH__: cmdOutput('git rev-parse --short HEAD') || 'unknown_commit',
      __BRANCH_NAME__: cmdOutput('git rev-parse --abbrev-ref HEAD') || 'unknown_branch',
      __TAG__: cmdOutput('git tag --points-at HEAD')
    })
  ],
};