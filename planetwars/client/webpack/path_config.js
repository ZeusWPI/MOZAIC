const path = require('path');

const WEBPACK_FOLDER = __dirname;
const ROOT_FOLDER = path.resolve(WEBPACK_FOLDER, '..');
const APP_FOLDER = path.resolve(ROOT_FOLDER, 'app');
const DIST_FOLDER = path.resolve(APP_FOLDER, 'dist');

module.exports = {
  WEBPACK_FOLDER, ROOT_FOLDER, APP_FOLDER, DIST_FOLDER
};
