import * as React from 'react';
import { div, h, li, p, ul } from "react-hyperscript-helpers";

import { IBotConfig } from '../../utils/ConfigModels';
import BotsConfig from "./BotsConfig";
import BotsList from "./BotsList";

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

// export interface IBotsProps {
//   bot: string,
//   bots: BotConfig[],
// }

// export class Bots extends React.Component<IBotsProps, {}> {
//   render() {
//     const bots = this.props.bots;
//     const cards = bots.map(bot => h(BotCard, { bot: bot }));
//     return div(cards.concat(h(NewBot)));
//   }
// }

// const BotCard: React.SFC<{ bot: BotConfig }> = props => {
//   const bot = props.bot;
//   const args: any[] = bot.args.map(arg => li([p(arg)]))
//   return div([
//     p(['-------']),
//     p([bot.name]),
//     p([bot.command]),
//     ul(args),
//     p(['-------'])
//   ]);
// }

// const NewBot: React.SFC<void> = props => {
//   return div([
//     "new bot"
//   ])
// }