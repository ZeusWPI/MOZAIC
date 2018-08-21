const path = require('path');

const baseDir = path.join(__dirname, '..');
const srcDir = 'src';
const outDir = 'dist';

const inProject = path.resolve.bind(path, baseDir);
const inProjectSrc = file => inProject(srcDir, file);

module.exports = {
  baseDir,
  srcDir,
  main: 'clientEntry',
  outDir,
  publicPath: '/',
  vendors: [],
  PATHS: {
    app: path.join(baseDir, srcDir),
    build: path.join(baseDir, outDir),
  },
  inProject,
  inProjectSrc,
};
