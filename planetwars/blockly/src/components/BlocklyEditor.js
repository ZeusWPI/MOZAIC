import React from 'react';
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import styleIdentifiers from './blocklyEditor.scss';

const styles = classNames.bind(styleIdentifiers);

const Blockly = require('node-blockly/browser');

const Blocks = require('./blocks');
const PlanetWars = require('./planetwars');

const Utils = require('../utils');

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.6;
Blockly.Blocks.variables.HUE = 33;
Blockly.Msg.VARIABLES_HUE = 33;
Blockly.Blocks.logic.HUE = 183;
Blockly.Msg.LOGIC_HUE = 183;
Blockly.Blocks.math.HUE = 213;
Blockly.Msg.MATH_HUE = 213;
Blockly.Blocks.lists.HUE = 333;
Blockly.Msg.LISTS_HUE = 333;
Blocks.inject(Blockly);

const toolbox = {
  entities: [
    'entities_planets',
    'entities_expeditions',
    'entities_players',
    'entities_player',
    'entities_nobody',
  ],
  functions: [
    'functions_owner',
    'functions_ship_count',
    'functions_origin',
    'functions_target',
    'functions_turns_remaining',
    'functions_distance',
    'functions_dispatch',
    'functions_progn',
  ],
  lists: [
    'lists_isEmpty',
    'lists_length',
    'lists_filter',
    'lists_minmax',
    'lists_forEach',
    'lists_sort',
  ],
  logic: [
    'logic_boolean',
    'logic_compare',
    'logic_null',
    'logic_operation',
    'logic_ternary',
    'controls_if',
  ],
  variables: ['variables_set', 'variables_get', 'math_change'],
  math: [
    'math_arithmetic',
    'math_constant',
    'math_constrain',
    'math_modulo',
    'math_number',
    'math_number_property',
    'math_on_list',
    'math_random_int',
    'math_round',
    'math_single',
  ],
};

// construct toolbox xml
function toolboxXml(toolboxP) {
  let toolboxStr = '<xml>';
  Object.entries(toolboxP).forEach(([catName, catEntries]) => {
    const colour = Blockly.Blocks[catName].HUE;
    toolboxStr += `<category name="${catName}" colour="${colour}">`;
    catEntries.forEach(blockName => {
      toolboxStr += `<block type="${blockName}"></block>`;
    });
    toolboxStr += '</category>';
  });
  toolboxStr += '</xml>';
  return toolboxStr;
}

class PlanetWarsBlockly {
  constructor(workspace) {
    this.workspace = workspace;
  }

  getCode() {
    return Blockly.JavaScript.workspaceToCode(this.workspace);
  }

  getXml() {
    const xml = Blockly.Xml.workspaceToDom(this.workspace);
    const xmlRext = Blockly.Xml.domToText(xml);
    return xmlRext;
  }

  loadXml(xmlRext) {
    const xml = Blockly.Xml.textToDom(xmlRext);
    Blockly.Xml.domToWorkspace(xml, this.workspace);
  }

  clear() {
    Blockly.mainWorkspace.clear();
  }

  addChangeListener(fun) {
    this.workspace.addChangeListener(fun);
  }
}

function inject(divId) {
  const tb = toolboxXml(toolbox);
  const workspace = Blockly.inject(divId, { toolbox: tb });
  return new PlanetWarsBlockly(workspace);
}

// export default inject;

export default class BlocklyEditor extends React.Component {
  static propTypes = {
    startVisualizer: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.saveCode = this.saveCode.bind(this);
    this.state = {};
  }

  componentDidMount() {
    this.ws = inject(this.blocklyDiv);
    console.log('blockly');
    this.forceUpdate();
  }

  componentWillReceiveProps() {}

  saveCode = () => {
    const code = this.ws.getCode();
    const { startVisualizer } = this.props;
    console.log(code);
    Utils.runMatch(code, 'your bot').then(matchLog => {
      console.log(matchLog);
      startVisualizer(matchLog);
    });
  };

  render() {
    console.log('render');
    const { showVisualizer } = this.props;
    return (
      <React.Fragment>
        <div
          id="blockly"
          ref={blocklyDiv => {
            this.blocklyDiv = blocklyDiv;
          }}
          className={styles('blockly') + (showVisualizer ? styles('hidden') : '')}
        />
        {
          <button onClick={this.saveCode} type="button">
            PLAY!
          </button>
        }
      </React.Fragment>
    );
  }
}
