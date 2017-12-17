import * as React from "react"
import * as path from 'path';
import * as fs from 'fs';

import { h } from "react-hyperscript-helpers"

let styles = require('./BotSelector.scss');

interface BotSelectorState {
  availableBots: path.ParsedPath[],
  selectedBots: path.ParsedPath[]
}

interface BotSelectorProps {
  setPlayers: Function
}

export class BotSelector extends React.Component<BotSelectorProps, BotSelectorState> {
  constructor(props: BotSelectorProps) {
    super(props);
    this.state = {
      availableBots: this.readBots(),
      selectedBots: []
    }
  }
  render() {
    let availableBots = this.state.availableBots.map((botPath:path.ParsedPath, key:number) =>
        h("li", `.${styles.botEntry}`, { key: key} , [
          botPath.name,
          h("button", `.${styles.loadBot}`, { onClick: (evt:any) => this.loadBot(botPath, evt) }, ["+"])
        ])
      )
    let selectedBots = this.state.selectedBots.map((botPath:path.ParsedPath, key:number) =>
        h("li", `.${styles.botEntry}`, { key: key} , [
          botPath.name,
          h("button", `.${styles.loadBot}`, { onClick: (evt:any) => this.removeBot(botPath, evt) }, ["-"])
        ])
      )
    return h("div", `.${styles.botSelector}`, [
      h("div", [h("ul", `.${styles.availableBots}`, [h("li", { key:-1 }, [h("div", `.${styles.listTitle}` ,["Available Bots"])]), availableBots])]),
      h("div", [h("ul", `.${styles.selectedBots}`, [h("li", { key:-1 }, [h("div", `.${styles.listTitle}` ,["Loaded Bots"])]), selectedBots])])
    ])
  }
  parseBot(botPath:path.ParsedPath) {
    // TODO: Errors 'n stuff...
    if(fs.existsSync(botPath.dir + "/" + botPath.base)) {
      let contents = fs.readFileSync(botPath.dir + "/" + botPath.base).toString();
      return JSON.parse(contents)
    }
  }
  // TODO: Maybe we should do this with one object per available bot, having a "loaded" field?
  loadBot(bot:path.ParsedPath, evt:any)  {
    evt.preventDefault();

    let selectedBots = this.state.selectedBots;
    selectedBots.push(bot);

    let availableBots = this.state.availableBots;
    let idx = availableBots.indexOf(bot)
    if(idx > -1) {
        availableBots.splice(idx, 1)
    }

    this.setState({ selectedBots: selectedBots, availableBots:availableBots });
    this.props.setPlayers(selectedBots.map((bot:path.ParsedPath) => this.parseBot(bot)))
  }
  removeBot(bot:path.ParsedPath, evt:any)  {
    evt.preventDefault();

    let availableBots = this.state.availableBots;
    availableBots.push(bot);

    let selectedBots = this.state.selectedBots;
    let idx = selectedBots.indexOf(bot)
    if(idx > -1) {
        selectedBots.splice(idx, 1)
    }

    this.setState({ selectedBots: selectedBots, availableBots:availableBots });
    this.props.setPlayers(selectedBots.map((bot:path.ParsedPath) => this.parseBot(bot)))
  }
  readBots(): path.ParsedPath[] {
    let dir = "./bots"
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }
}
