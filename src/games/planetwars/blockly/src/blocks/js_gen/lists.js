var Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

module.exports = {
  'filter': function(block) {
    var list = JS.valueToCode(block, 'LIST');
    var predicate = JS.valueToCode(block, 'PREDICATE');
    var elem_name = JS.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var body = JS.prefixLines(`return ${predicate};`, JS.INDENT);
    var pred_str = `(${elem_name}) => {\n${body}\n}`;
    var code = `${list}.filter(${pred_str})`;
    return [code, JS.ORDER_MEMBER];
  },
  'sort': function(block) {
    var list = JS.valueToCode(block, 'LIST');
    var expr = JS.valueToCode(block, 'EXPR');
    var elem_name = JS.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var body = JS.prefixLines(`return ${expr};`, JS.INDENT);
    var keyfn_str = `(${elem_name}) => {\n${body}\n}`;
    var code = `sort_by(${list}, ${keyfn_str})`;
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'minmax': function(block) {
    var list = JS.valueToCode(block, 'LIST');
    var value_expr = JS.valueToCode(block, 'EXPR');

    var elem_name = JS.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var body = JS.prefixLines(`return ${value_expr};`, JS.INDENT);
    var expr_str = `(${elem_name}) => {\n${body}\n}`;
    var fun_str;
    if (block.getFieldValue('MODE') == 'MINIMIZE') {
      fun_str = 'minimum_by';
    } else {
      fun_str = 'maximum_by';
    }

    var code = `${fun_str}(${list}, ${expr_str})`;
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'forEach': function(block) {
    var list = JS.valueToCode(block, 'LIST');
    var stmts = JS.statementToCode(block, 'DO');
    var elem_name = JS.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );
    return `${list}.forEach((${elem_name}) => {\n${stmts}});\n`;
  }
};
