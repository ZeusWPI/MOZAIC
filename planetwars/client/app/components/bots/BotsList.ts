import * as React from 'react';
import * as path from 'path';
import * as fs from 'fs';

import {RouteComponentProps} from 'react-router';
import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";
import BotElement from './BotElement';

let styles = require("./BotsList.scss");

interface BotsListProps {
  rerender: () => any
  bots: string[]
}

interface BotsListState {

}

// export default class BotsList extends React.Component<BotsListProps> {
//   constructor(props: BotsListProps) {
//     super(props);
//   }
//
//   render() {
//
//     let bots = this.props.bots;
//
//     let botElements = bots.map((botName: string) =>
//       h(BotElement, {name: botName, removeBot: this.removeBot})
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
//   }
//
  function  removeBot(name: string, evt: any) {
    evt.preventDefault(); // Stop the Link from being activated
    let path = `./bots/${ name }.json`;
    if (fs.existsSync(path) && confirm(`Are you sure you want to delete ${ name }?`)) {
      fs.unlinkSync(path);
    }
    props.rerender();
  }




const BotsList = (props: BotsListProps) => {
  let bots = props.bots;

    let botElements = bots.map((botName: string) =>
      h(BotElement, {name: botName, removeBot: removeBot})
    );

    botElements.push(
      h(Link, `.${styles.botsentry}`, {to: "/bots/"}, [
        h("li", `.${styles.botlistitem}`, ["New Bot"])
      ])
    );

    return (
      h("ul", `.${styles.botslist}`, botElements)
    );

};

export default BotsList


