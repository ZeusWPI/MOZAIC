import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';
import { Link } from "react-router-dom"

let styles = require("./BotsList.scss");

interface BotsListProps {

}

interface BotsListState {

}

export default class BotsList extends React.Component<BotsListProps, BotsListState> {
  constructor(props:BotsListProps) {
    super(props);
  }

  render() {
    // TODO: get bots form machine
    let bots = ["Testbot", "Testbot2"]

    return (
      h("ul", `.${styles.botslist}`, bots.map((botName:string) => h(Link, `.${styles.botsentry}`, { to: `/bots/${botName}`}, [h("li" , [botName])])))
    );
  }
}
