import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers';

import { ConfigForm } from './configform/ConfigForm';
import { ConfigSelector } from './configSelector/ConfigSelector';
import { NamedConfig } from '../../utils/MatchConfig';

let styles = require('./GameSetup.scss');

interface State {
  configFiles: path.ParsedPath[],
  selectedConfig?: NamedConfig
}

interface Props {
  onReady(p: path.ParsedPath): void,
};

export class GameSetup extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configFiles: ConfigSelector.readConfigs(),
    }
  }

  render() {
    return div(`.${styles.gameSetup}`, [
      h(ConfigSelector, {
        files: this.state.configFiles,
        selectFile: (p: path.ParsedPath) => this.ready(p),
      }),
      h(ConfigForm, {
        matchConfig: this.state.selectedConfig,
        onSubmit: (config: NamedConfig) => this.saveConfig(config),
        onRemove: (config: NamedConfig) => this.removeConfig(config),
      })
    ])
  }

  ready(p: path.ParsedPath) {
    this.setState({ selectedConfig: this.loadConfig(p) })
    this.props.onReady(p);
  }

  loadConfig(p: path.ParsedPath): NamedConfig | undefined {
    try {
      let contents = fs.readFileSync(path.format(p), 'utf8');
      let config = JSON.parse(contents);
      return { configName: p.name, config: config };
    } catch (e) {
      // TODO: Improve error handling
      alert("Could not load configuration");
      console.error(e);
      return undefined;
    }
  }

  saveConfig(config: NamedConfig): any {
    let p = path.join('.', 'configs', `${config.configName}.json`);
    let warn = () => {
      return confirm(`Configuration with name ${config.configName} already exist, do you want to overwrite it?`)
    }
    if (!(fs.existsSync(p)) || warn()) {
      // TODO: Errors
      fs.writeFileSync(p, JSON.stringify(config.config, null, 2));
      alert(`Succesfully saved configuration ${config.configName}.`);
    }
  }

  removeConfig(config: NamedConfig): any {
    this.setState({ selectedConfig: undefined });
    let p = path.join('.', 'configs', `${config.configName}.json`);
    let warn = () => {
      return confirm(`Are you certain you want to remove config with name ${config.configName}?`)
    }
    if (!(fs.existsSync(p)) || warn()) {
      // TODO: Errors
      fs.unlinkSync(p);
      alert(`Succesfully removed configuration ${config.configName}.`);
    }
  }
}