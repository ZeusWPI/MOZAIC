const Blockly = require('node-blockly');

const defs = require('./blocks/defs');
const js_gen = require('./blocks/js_gen');

function inject_blocks(blockly) {
  load_block_defs(blockly.Blocks);
  load_js_generators(blockly.JavaScript);
}

function load_block_defs(table) {
   Object.entries(defs).forEach(([cat_name, blocks]) => {
     Object.entries(blocks).forEach(([block_name, block]) => {
       table[qualified_name(cat_name, block_name)] = block;
    });
  });
}

function load_js_generators(table) {
  Object.entries(js_gen).forEach(([cat_name, generators]) => {
    Object.entries(generators).forEach(([block_name, generator]) => {
      table[qualified_name(cat_name, block_name)] = generator;
    });
  });
}

function qualified_name(cat_name, block_name) {
  return cat_name + '_' + block_name;
}

module.exports = {
  inject_blocks: inject_blocks
};
