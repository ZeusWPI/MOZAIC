
import * as path from 'path'; import * as fs from 'fs'; import * as React from
'react';

import { BotSelector } from "./BotSelector"
import { MatchConfig, PlayerConfig } from "../../utils/Models"
import { h } from 'react-hyperscript-helpers';

let styles = require('./Setup.scss');

interface SetupState {
  config: MatchConfig,
  map_path: path.ParsedPath | { name: string }
}

interface SetupProps {
  startGame: Function
}

export class Setup extends React.Component<SetupProps, SetupState> {
  constructor(props: SetupProps) {
    super(props);
    this.state = {
      config: {
        players: [],
        game_config: {
          map_file: "",
          max_turns: 500
        }
      },
      map_path: { name: "" }
    }
  }

  render() {
    let maps = this.readMaps();
    let mapElements = maps.map((mapPath:path.ParsedPath) => h(MapOption, { path: mapPath }))
    mapElements.push(h("option", { value: "", label: "Select Map" }))
    return h("form", `.${styles.setup}`, {
        onSubmit: () => this.addToQueue()
      }, [
      h("div", `.${styles.selectForm}`, [
        h("div", `.${styles.botSelector}`, [
          h(BotSelector, { setPlayers: (players:PlayerConfig[]) => this.setPlayers(players) })
        ]),
        h("div", [
          "Map: ",
          h("select", { onChange: (evt:any) => this.handleMap(evt), value: this.state.map_path.name }, mapElements)
        ]),
        h("div", [
          "Max turns: ",
          h("input", { type:"number", value:this.state.config.game_config.max_turns, onChange: (evt:any) => this.handleMaxTurns(evt)})
        ])
      ]),
      h("div", `.${styles.playContainer}`, [
        h("input", { type: "submit", value:"Play" })
      ])
    ])
  }
  setPlayers( players:PlayerConfig[] ) {
    let config = this.state.config;
    config.players = players;
    this.setState({ config: config })
  }
  handleMap(evt:any) {
    let config = this.state.config;
    let map_path = undefined;
    if (!evt.target.value || evt.target.value == "Select map") {
      map_path = { name: "" };
      config.game_config.map_file = ""
    } else {
      map_path = path.parse("./maps/" + evt.target.value + ".json");
      config.game_config.map_file = "./maps/" + evt.target.value + ".json";
    }
    this.setState({ config: config, map_path: map_path})
  }
  handleMaxTurns(evt:any) {
    let config = this.state.config;
    config.game_config.max_turns = parseInt(evt.target.value);
    if (!config.game_config.max_turns || config.game_config.max_turns < 0) {
      config.game_config.max_turns = 0
    }
    this.setState({ config: config })
  }
  readMaps(): path.ParsedPath[] {
    let dir = "./maps"
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      fileNames = fileNames.filter((name) => name.substring(name.length - 5) == ".json");
      let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }
  addToQueue(): void {
    // TODO: Probably shouldn't use alert()
    if(!this.state.config.game_config.map_file) {
      alert("Please select a map");
      return;
    }
    if(this.state.config.players.length < 2) {
      alert("Please select two or more bots");
      return;
    }
    this.props.startGame(this.state.config);
  }
}

interface MapOptionState {

}

interface MapOptionProps {
  path: path.ParsedPath
}

export class MapOption extends React.Component<MapOptionProps, MapOptionState> {
  constructor(props:MapOptionProps) {
    super(props);
  }
  render() {
    return h("option", [this.props.path.name]);
  }
}
