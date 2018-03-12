import * as React from 'react';
import * as path from 'path';
import * as fs from 'fs';

import {RouteComponentProps} from 'react-router';
import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";
import BotElement from './containers/BotElementContainer';
import * as Promise from "bluebird";
import {IBotConfig} from "../../utils/ConfigModels";

let styles = require("./BotsList.scss");

export interface BotsListProps {
  refreshBots: () => Promise<void>,
  bots: IBotConfig[]
}


export default class BotsList extends React.Component<BotsListProps, any> {

  constructor(props: BotsListProps) {
    super(props);
  }


  render() {


    let botElements: React.Component[] = this.props.bots.map((botConfig: IBotConfig) =>
      (h(BotElement, `.${styles.botlistitem}`,
          {key: botConfig.name, name: botConfig.name, refreshBots: this.props.refreshBots})
      )
    );

    botElements.push(
      h(Link, `.${styles.botsentry}`, {to: "/bots/"}, [
        h("li", `.${styles.botlistitem}`, ["New Bot"])
      ])
    );

    return (
      h("ul", `.${styles.botslist}`, [botElements])
    );
  }


}


// const BotsList = (props: BotsListProps) => {
//   let bots = props.bots;
//
//     let botElements = bots.map((botName: string) =>
//       h(BotElement, {name: botName, removeBot: removeBot})
//     );
//
//     botElements.push(
//       h(Link, `.${styles.botsentry}`, {to: "/bots/"}, [
//         h("li", `.${styles.botlistitem}`, ["New Bot"])
//       ])
//     );
//
//     return (
//       h("ul", `.${styles.botslist}`, botElements)
//     );
//
// };
//
// export default BotsList


