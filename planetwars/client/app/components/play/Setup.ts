
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';

import { h } from 'react-hyperscript-helpers';
import { Config } from '../../utils/Config';
import { IBotConfig, IMatchConfig } from "../../utils/ConfigModels";
import { BotSelector } from "./BotSelector";

// tslint:disable-next-line:no-var-requires
const styles = require('./Setup.scss');

interface ISetupState {
  config: IMatchConfig;
  map_path: path.ParsedPath | { name: string };
}

interface ISetupProps {
  startGame: Function
}

export class Setup extends React.Component<ISetupProps, ISetupState> {
  constructor(props: ISetupProps) {
    super(props);
    this.state = {
      config: {
        players: [],
        game_config: {
          map_file: "",
          max_turns: 500,
        },
      },
      map_path: { name: "" },
    };
  }

  public render() {
    const maps = this.readMaps();
    const mapElements = maps.map((mapPath: path.ParsedPath) => h(MapOption, { path: mapPath }));
    mapElements.push(h("option", { value: "", label: "Select Map" }));
    return h("form", `.${styles.setup}`, { onSubmit: () => this.addToQueue() },
      [
        h("div", `.${styles.selectForm}`, [
          h("div", `.${styles.botSelector}`, [
            h(BotSelector, {
              setPlayers: (players: IBotConfig[]) => this.setPlayers(players),
            }),
          ]),
          h("div", [
            "Map: ",
            h("select", {
              onChange: (evt: any) => this.handleMap(evt),
              value: this.state.map_path.name,
            }, mapElements),
          ]),
          h("div", [
            "Max turns: ",
            h("input", {
              type: "number",
              value: this.state.config.game_config.max_turns,
              onChange: (evt: any) => this.handleMaxTurns(evt),
            }),
          ]),
        ]),
        h("div", `.${styles.playContainer}`, [
          h("input", { type: "submit", value: "Play" }),
        ]),
      ],
    );
  }

  public setPlayers(players: IBotConfig[]) {
    const config = this.state.config;
    config.players = players;
    this.setState({ config });
  }

  public handleMap(evt: any) {
    const config = this.state.config;
    let mapPath;
    if (!evt.target.value || evt.target.value === "Select map") {
      mapPath = { name: "" };
      config.game_config.map_file = "";
    } else {
      mapPath = path.parse(Config.mapMath(evt.target.value));
      config.game_config.map_file = Config.mapMath(evt.target.value);
    }
    this.setState({ config, map_path: mapPath });
  }

  public handleMaxTurns(evt: any) {
    const config = this.state.config;
    config.game_config.max_turns = parseInt(evt.target.value, 10);
    if (!config.game_config.max_turns || config.game_config.max_turns < 0) {
      config.game_config.max_turns = 0;
    }
    this.setState({ config });
  }

  public readMaps(): path.ParsedPath[] {
    const dir = Config.maps;
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      fileNames = fileNames.filter((name) => name.substring(name.length - 5) === ".json");
      const paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }

  public addToQueue(): void {
    // TODO: Probably shouldn't use alert()
    if (!this.state.config.game_config.map_file) {
      alert("Please select a map");
      return;
    }
    if (this.state.config.players.length < 2) {
      alert("Please select two or more bots");
      return;
    }
    this.props.startGame(this.state.config);
  }
}

interface IMapOptionState {

}

interface IMapOptionProps {
  path: path.ParsedPath;
}

export class MapOption extends React.Component<IMapOptionProps, IMapOptionState> {
  constructor(props: IMapOptionProps) {
    super(props);
  }
  public render() {
    return h("option", [this.props.path.name]);
  }
}
