import * as React from 'react';
import { h, div, p, li, ul } from "react-hyperscript-helpers";

import { BotsList } from './BotsList';
import { BotsConfig } from './BotsConfig';
import { IBotConfig } from '../../utils/ConfigModels';

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsProps {
  bots: IBotConfig[];
  selectedBot: IBotConfig;
  saveBot: (bot: IBotConfig) => void;
  removeBot: (name: string) => void;
}

export class Bots extends React.Component<IBotsProps, {}> {

  public render() {
    const { bots, removeBot, saveBot, selectedBot } = this.props;
    return div(`.${styles.botPage}`, [
      div(`.${styles.bots}`, [
        h(BotsList, { bots, removeBot }),
        h(BotsConfig, { selectedBot, saveBot }),
      ]),
    ]);
  }
}
