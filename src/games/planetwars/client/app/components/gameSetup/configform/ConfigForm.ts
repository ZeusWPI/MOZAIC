import * as fs from 'fs';

import * as React from 'react';
import { h, div, button, p } from 'react-hyperscript-helpers';
import Form from 'react-jsonschema-form';
import FormProps from 'react-jsonschema-form';

import { NamedConfig } from '../GameSetup';
import { configSchema, configUISchema } from './Schemas';

let styles = require('./ConfigForm.scss');

interface State {
  formData: NamedConfig,
}

interface Props {
  matchConfig?: NamedConfig,
  onSubmit(config: NamedConfig): any,
  onRemove(config: NamedConfig): any,
}

export class ConfigForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      formData: <NamedConfig> props.matchConfig || defaultValues(),
    };
  }

  componentWillReceiveProps(props: Props) {
    this.setState({
      formData: <NamedConfig> props.matchConfig || defaultValues(),
    });
  }

  render() {
    return h(Form, `.${styles.configForm}`, {
      schema: configSchema,
      uiSchema: configUISchema,
      formData: this.state.formData,
      showErrorList: false,
      noHtml5Validate: true,
      onSubmit: (form: any) => this.props.onSubmit(form.formData),
    }, [
      div([
        button('.btn.btn-info', { type: 'submit' }, ['Save']),
        button('.btn.btn-warning', { 
          type: 'reset',
          onClick: () => this.forceUpdate(),
        }, ['Reset']),
        button('.btn.btn-danger', { 
          type: 'button',
          onClick: (form: any) => this.props.onRemove(this.state.formData),
        }, ['Remove']),
      ])
    ]);
  }
}

function defaultValues() {
  return { 
    'configName': '',
    'config': {
      'players': [{ 'name': '', 'cmd': '', 'args': [''] }],
      'game_config': {
        'map_file': '',
        'max_turns': 500
      },
      'log_file': 'gamelog.json'
    }
  }
}

function validate(form: any, errors: any) {
  const requiredField = 'This is a required field';

  if (!testUnique(form.players.map((a: any) => a.name))) {
    errors.players.addError('Duplicate names found');
  }

  for (var i = 0; i < form.players.length; i++) {
    if (isEmpty(form.players[i].name)) {
      errors.players[i].name.addError(requiredField);
    }

    if (isEmpty(form.players[i].cmd)) {
      errors.players[i].cmd.addError(requiredField);
    }

    for (var j = 0; j < form.players[i].args.length; j++) {
      if (isEmpty(form.players[i].args[j])) {
        errors.players[i].args[j].addError('Please remove empty arguments');
      }
    }
  }

  if (isEmpty(form.log_file)) {
    errors.log_file.addError(requiredField);
  }

  if (isEmpty(form.config_name)) {
    errors.config_name.addError(requiredField);
  }

  if (isEmpty(form.game_config.map_file)) {
    errors.game_config.map_file.addError(requiredField);
  }

  if (isEmpty(form.game_config.max_turns)) {
    errors.game_config.max_turns.addError(requiredField);
  }
  return errors;
}

function isEmpty(value: any) {
  return (value == '' || value == undefined)
}

function testUnique(list: Array<any>) {
  var unique = true;

  for (var i = 0; i < list.length; i++) {
    if (!(list.indexOf(list[i]) === i)) {
      unique = false;
    }
  }
  return unique;
}