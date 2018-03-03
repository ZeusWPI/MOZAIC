import * as React from 'react';
import * as path from 'path';
import * as fs from 'fs';

import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';
import { Link } from "react-router-dom"

import { Config } from '../../utils/Config';

let styles = require("./BotsList.scss");

interface BotsListProps {
  rerender: Function
}

interface BotsListState {

}

export default class BotsList extends React.Component<BotsListProps, BotsListState> {
  constructor(props: BotsListProps) {
    super(props);
  }

  render() {
    let bots = this.readBots().map((x: path.ParsedPath) => x.name)
    let botElements = bots.map((botName: string) =>
      h(Link, `.${styles.botsentry}`, { to: `/bots/${botName}` }, [
        h("li", `.${styles.botlistitem}`, [
          botName,
          h("button", `.${styles.removebot}`, { onClick: (evt: any) => this.removeBot(botName, evt) }, ["x"])
        ])
      ])
    )
    botElements.push(
      h(Link, `.${styles.botsentry}`, { to: "/bots/" }, [
        h("li", `.${styles.botlistitem}`, ["New Bot"])
      ])
    )
    return (
      h("ul", `.menu-list.${styles.botslist}`, botElements)
    );
  }
  removeBot(name: string, evt: any) {
    evt.preventDefault(); // Stop the Link from being activated
    let p = Config.botPath(name);
    if (fs.existsSync(p) && confirm(`Are you sure you want to delete ${name}?`)) {
      fs.unlinkSync(p);
    }
    this.props.rerender();
  }
  readBots(): path.ParsedPath[] {
    let dir = Config.bots;
    if (fs.existsSync(dir)) {
      let fileNames = fs.readdirSync(dir);
      fileNames = fileNames.filter(file => fs.lstatSync(path.resolve(dir, file)).isFile())
      let paths = fileNames.map((f) => path.parse(path.resolve(dir, f)));
      return paths;
    }
    return [];
  }
}
