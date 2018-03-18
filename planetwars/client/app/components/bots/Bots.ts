import * as React from 'react';
import { h, div, p, li, ul } from "react-hyperscript-helpers";

import { BotsList } from './BotsList';
import { BotsConfig } from './BotsConfig';
import { IBotConfig, IBotList, IBotData, BotID } from '../../utils/ConfigModels';

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsStateProps {
  bots: IBotList;
  selectedBot?: IBotData;
}

export interface IBotsFuncProps {
  addBot: (bot: IBotConfig) => void;
  removeBot: (uuid: BotID) => void;
  editBot: (bot: IBotData) => void;
}

type IBotsProps = IBotsStateProps & IBotsFuncProps;

export class Bots extends React.Component<IBotsProps, {}> {

  public render() {
    const { bots, selectedBot, removeBot, addBot, editBot } = this.props;
    return div(`.${styles.botPage}`, [
      div(`.${styles.bots}`, [
        h(BotsList, { bots, removeBot }),
        h(BotsConfig, { selectedBot, addBot, editBot }),
      ]),
    ]);
  }
}
