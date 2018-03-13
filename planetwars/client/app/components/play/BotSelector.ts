import * as React from "react"
import * as path from 'path';
import * as fs from 'fs';

import { h, li, button, div, ul } from "react-hyperscript-helpers"
import { Config } from "../../utils/Config";

// tslint:disable-next-line:no-var-requires
const styles = require('./BotSelector.scss');

interface IBotSelectorState {
  availableBots: path.ParsedPath[];
  selectedBots: path.ParsedPath[];
}

interface IBotSelectorProps {
  setPlayers: Function
}

export class BotSelector extends React.Component<IBotSelectorProps, IBotSelectorState> {
  constructor(props: IBotSelectorProps) {
    super(props);
    this.state = {
      availableBots: this.readBots(),
      selectedBots: [],
    };
  }

  public render() {
    const availableBots = this.state.availableBots.map((botPath: path.ParsedPath, key: number) =>
      li(`.${styles.botEntry}`, { key }, [
        botPath.name,
        button(`.${styles.loadBot}`, {
          onClick: (evt: any) => this.loadBot(botPath, evt),
        }, ["+"]),
      ]),
    );

    const selectedBots = this.state.selectedBots.map((botPath: path.ParsedPath, key: number) =>
      li(`.${styles.botEntry}`, { key }, [
        botPath.name,
        button(`.${styles.loadBot}`, {
          onClick: (evt: any) => this.removeBot(botPath, evt),
        }, ["-"]),
      ]),
    );

    return div(`.${styles.botSelector}`, [
      div([
        ul(`.${styles.availableBots}`, [
          li({ key: -1 }, [
            div(`.${styles.listTitle}`, ["Available Bots"]),
          ]),
          availableBots,
        ]),
      ]),
      div([
        ul(`.${styles.selectedBots}`, [
          li({ key: -1 }, [div(`.${styles.listTitle}`, ["Loaded Bots"])]),
          selectedBots,
        ]),
      ]),
    ]);
  }

  private parseBot(botPath: path.ParsedPath) {
    // TODO: Errors 'n stuff...
    if (fs.existsSync(botPath.dir + "/" + botPath.base)) {
      const contents = fs.readFileSync(botPath.dir + "/" + botPath.base).toString();
      return JSON.parse(contents)
    }
  }

  // TODO: Maybe we should do this with one object per available bot, having a "loaded" field?
  private loadBot(bot: path.ParsedPath, evt: any) {
    evt.preventDefault();

    const selectedBots = this.state.selectedBots;
    selectedBots.push(bot);

    const availableBots = this.state.availableBots;
    const idx = availableBots.indexOf(bot);
    if (idx > -1) {
      availableBots.splice(idx, 1);
    }

    this.setState({ selectedBots, availableBots });
    this.props.setPlayers(selectedBots.map((_bot: path.ParsedPath) => this.parseBot(_bot)));
  }

  private removeBot(bot: path.ParsedPath, evt: any) {
    evt.preventDefault();

    const availableBots = this.state.availableBots;
    availableBots.push(bot);

    const selectedBots = this.state.selectedBots;
    const idx = selectedBots.indexOf(bot);
    if (idx > -1) {
      selectedBots.splice(idx, 1);
    }

    this.setState({ selectedBots, availableBots });
    this.props.setPlayers(selectedBots.map((_bot: path.ParsedPath) => this.parseBot(_bot)));
  }

  private readBots(): path.ParsedPath[] {
    const dir = Config.bots;
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      fileNames = fileNames.filter((file) => fs.lstatSync(path.resolve(Config.bots, file)).isFile());
      const paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }
}
