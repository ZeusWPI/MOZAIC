import * as React from 'react';
import { h } from "react-hyperscript-helpers"

import BotsConfig from "./bots/BotsConfig"
import BotsList from "./bots/BotsList"

let styles = require("./Bots.scss");

interface BotsProps {
  bot:string
}

interface BotsState {

}

export default class Bots extends React.Component<BotsProps, BotsState> {
  constructor(props:BotsProps) {
    super(props);
  }
  render() {
    return h("div", `.${styles.bots}`, [
      h("div", `.${styles.botslist}`, [h(BotsList, { rerender: () => this.forceUpdate() })]),
      h("div", `.${styles.botsconfig}`, [h(BotsConfig, { botName: this.props.bot, rerender: () => this.forceUpdate() })])
    ])
  }
}
