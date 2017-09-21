const Blockly = require('node-blockly/browser');
const defs = require('./blocks/defs');
const js_gen = require('./blocks/js_gen');

function load_blocks() {
  // register custom blocks
  Object.entries(defs).forEach(([cat_name, blocks]) => {
    Object.entries(blocks).forEach(([block_name, block]) => {
      Blockly.Blocks[qualified_name(cat_name, block_name)] = block;
    });
  });

  // register code generators
  Object.entries(js_gen).forEach(([cat_name, generators]) => {
    Object.entries(generators).forEach(([block_name, generator]) => {
      Blockly.JavaScript[qualified_name(cat_name, block_name)] = generator;
    });
  });
}

function qualified_name(cat_name, block_name) {
  return cat_name + '_' + block_name;
}

module.exports = {
  init: load_blocks
};
