import * as React from "react";
import { h, div, li, p, ul } from 'react-hyperscript-helpers';

import { IBotConfig, IBotList, IBotData, BotID } from '../../utils/ConfigModels';
import { Link } from "react-router-dom";

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface IPlayPageStateProps {
  bots: IBotList;
  selectedBots: BotID[];
}

export interface IPlayPageDispatchProps {
  selectBot: (uuid: string) => void;
  unselectBot: (uuid: string, all: boolean) => void;
}

export interface IPlayPageState {

}

type PlayPageProps = IPlayPageStateProps & IPlayPageDispatchProps;

export class PlayPage extends React.Component<PlayPageProps, IPlayPageState> {
  public render() {
    const { bots, selectedBots, selectBot, unselectBot } = this.props;
    return div(`.${styles.playPage}`, [
      h(BotsList, { bots, selectedBots, selectBot, unselectBot }),
      h(MatchSetup, {}),
    ]);
  }
}

export class MatchSetup extends React.Component<{}, {}> {
  public render() {
    return div(`.${styles.matchSetupPane}`, ['Setup yo']);
  }
}

interface IBotListProps {
  bots: IBotList;
  selectedBots: BotID[];
  selectBot: (uuid: BotID) => void;
  unselectBot: (uuid: string, all: boolean) => void;
}

export class BotsList extends React.Component<IBotListProps, {}> {
  public render() {
    const bots = Object.keys(this.props.bots).map((uuid) => {
      const selected = this.props.selectedBots.indexOf(uuid) >= 0;
      const bot = this.props.bots[uuid];
      const { selectBot, unselectBot } = this.props;
      return BotListItem({ bot, selected, selectBot, unselectBot });
    });

    const newBot = div(`.${styles.newBot}`, [
      h(Link, `.${styles.newBot}`, { to: "/bots/" }, [
        li([p(['New Bot'])]),
      ]),
    ]);

    return div(`.${styles.botsListPane}`, [
      ul([newBot].concat(bots)),
    ]);
  }
}

interface IBotListItemProps {
  selected: boolean;
  bot: IBotData;
  selectBot: (uuid: BotID) => void;
  unselectBot: (uuid: string, all?: boolean) => void;
}

// tslint:disable-next-line:variable-name
const BotListItem: React.SFC<IBotListItemProps> = (props) => {
  const { config, lastUpdatedAt, createdAt, uuid } = props.bot;
  const command = [config.command].concat(config.args).join(' ');
  const selected = (props.selected) ? `.${styles.selected}` : '';
  const selector = (selected)
    ? () => props.unselectBot(uuid, true)
    : () => props.selectBot(uuid);

  return li(`.${styles.botListItem}${selected}`,
    {
      key: uuid,
      onClick: selector,
    },
    [
      p([config.name]),
      p([command]),
    ]);
};
