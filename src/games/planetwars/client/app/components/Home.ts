import * as path from 'path';
import * as fs from 'fs';

import * as React from 'react';

import { Visualizer } from './visualizer/index';
import { ConfigForm } from './configform/ConfigForm';
import { ConfigSelector } from './configSelector/ConfigSelector';
import { h, div } from 'react-hyperscript-helpers';

let styles = require('./Home.scss');

interface State {
  configFiles: path.ParsedPath[],
  selectedConfig?: NamedConfig
}

interface Props { };

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configFiles: ConfigSelector.readConfigs(),
    }
  }

  render() {
    return div(`.${styles.homePage}`, [
      div(`.${styles.configController}`, [
        h(ConfigSelector, {
          files: this.state.configFiles,
          previewFile: (p: path.ParsedPath) => {
            this.setState({selectedConfig: this.loadConfig(p)})
          },
          selectFile: (p: path.ParsedPath) => this.play(p),
        }),
        h(ConfigForm, {
          matchConfig: this.state.selectedConfig,
          onSubmit: (config: NamedConfig) => this.saveConfig(config),
          onRemove: (config: NamedConfig) => this.removeConfig(config),
        })
      ]),
      // div(`.${styles.visualizer}`, [h(Visualizer)]),
    ])
  }

  play(config: path.ParsedPath) {
    alert("Yowkes!");
  }

  loadConfig(p: path.ParsedPath): NamedConfig | undefined {
    try {
      let contents = fs.readFileSync(path.format(p), 'utf8');
      let config = JSON.parse(contents);
      return {configName: p.name, config: config};
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
    this.setState({selectedConfig: undefined});
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

export interface NamedConfig {
  configName: string,
  config: MatchConfig,
}

// Note the distinction in casing between MatchConfig and the config schema.
interface MatchConfig {
  players: PlayerConfig[],
  game_config: GameConfig,
}

interface GameConfig {
  map_file: string,
  max_turns: number,
}

interface PlayerConfig {
  name: string,
  cmd: string,
  args: string[],
}