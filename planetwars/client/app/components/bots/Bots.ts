import * as React from 'react';
import { div, h, li, p, ul } from "react-hyperscript-helpers";

import { IBotConfig } from '../../utils/ConfigModels';
import BotsConfig from "./BotsConfig";
import BotsList from "./BotsList";

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsProps {
  bot: string;
}

export class Bots extends React.Component<IBotsProps, {}> {
  constructor(props: IBotsProps) {
    super(props);
  }
  public render() {
    return h("div", `.${styles.bots}`, [
      h("div", `.${styles.botslist}`, [
        h(BotsList, {
          rerender: () => this.forceUpdate(),
        }),
      ]),
      h("div", `.${styles.botsconfig}`, [
        h(BotsConfig, {
          botName: this.props.bot,
          rerender: () => this.forceUpdate(),
        }),
      ]),
    ]);
  }
}
