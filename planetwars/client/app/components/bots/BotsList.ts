import * as React from 'react';
import * as path from 'path';
import * as fs from 'fs';
import * as Promise from "bluebird";
import { IBotConfig, IBotList } from "../../utils/ConfigModels";

import { h, ul, li, button, div } from 'react-hyperscript-helpers';
import { Link } from "react-router-dom";

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsListProps {
  bots: IBotList;
  removeBot: (name: string) => void;
}

export class BotsList extends React.Component<IBotsListProps, any> {

  public render() {
    const { bots, removeBot } = this.props;
    const botElements = Object.keys(bots).map((uuid: string) => {
      const { config } = bots[uuid];
      return h(BotElement, {
        key: uuid,
        name: config.name,
        removeBot,
      });
    });

    return div(`.${styles.botsListPane}`, [
      h(NewBot),
      ul([botElements]),
    ]);
  }
}

// tslint:disable-next-line:variable-name
export const NewBot: React.SFC<void> = (props) => {
  return div(`.${styles.newBot}`, [
    h(Link, { to: "/bots/" }, ["New Bot"]),
  ]);
};

interface IBotElementProps {
  name: string;
  removeBot: (name: string) => void;
}

export class BotElement extends React.Component<IBotElementProps, {}> {
  public render() {
    return h(Link, `.${styles.botsElement}`, { to: `/bots/${this.props.name}` }, [
      li([
        this.props.name,
        button(`.${styles.removeBot}`, {
          onClick: (evt: any) => {
            this.props.removeBot(this.props.name);
          },
        }, ["x"]),
      ]),
    ]);
  }
}
