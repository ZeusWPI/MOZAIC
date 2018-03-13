import * as React from 'react';
import { h, div, p, li, ul } from "react-hyperscript-helpers";

import BotsConfig from "./containers/BotsConfigContainer";
import BotsList from "./containers/BotsListContainer";
import { IBotConfig } from '../../utils/ConfigModels';

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsProps {
  bot: IBotConfig | null;
}

export class Bots extends React.Component<IBotsProps, {}> {
  constructor(props: IBotsProps) {
    super(props);
  }
  render() {
    return h("div", `.${styles.bots}`, [
      h("div", `.${styles.botslist}`, [h(BotsList)]),
      h("div", `.${styles.botsconfig}`,
        [h(BotsConfig, { loadedBot: this.props.bot })])
    ])
  }
}
