import * as React from 'react';
import * as path from 'path';
import * as fs from 'fs';

import {RouteComponentProps} from 'react-router';
import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";
import BotElement from './containers/BotElementContainer';
import {IState} from "../../reducers";

let styles = require("./BotsList.scss");

interface BotsListProps {
  rerender: () => void,
  bots: string[]
}

interface BotsListState {

}

export default class BotsList extends React.Component<BotsListProps, IState> {
  constructor(props: BotsListProps) {
    super(props);
  }

  componentWillMount() {
  this.props.rerender();
  }

  render() {


    let botElements = this.props.bots.map((botName: string) =>
      h(BotElement, {name: botName, rerender: this.props.rerender})
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


