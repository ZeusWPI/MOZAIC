import * as React from "react";
import { h, div, li, p, ul } from 'react-hyperscript-helpers';

import { IBotConfig, IBotList, IBotData, BotID } from '../../utils/ConfigModels';
import { Link } from "react-router-dom";

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface IPlayPageStateProps {
  bots: IBotList;
  selectedBots: string[]; // List of bots (uuid) that are currently selected for playing

}

export interface IPlayPageDispatchProps {

}

export interface IPlayPageState {

}

type PlayPageProps = IPlayPageStateProps & IPlayPageDispatchProps;

export class PlayPage extends React.Component<PlayPageProps, IPlayPageState> {
  public render() {
    const { bots, selectedBots } = this.props;
    return div(`.${styles.playPage}`, [
      h(BotsList, { bots, selectedBots }),
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
  selectedBots: string[];
}

export class BotsList extends React.Component<IBotListProps, {}> {
  public render() {

    const bots = Object.keys(this.props.bots).map((uuid) => {
      const selected = this.props.selectedBots;
      return BotListItem(this.props.bots[uuid], { selected });
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

// tslint:disable-next-line:variable-name
const BotListItem: React.SFC<IBotData> = (props) => {
  const { config, lastUpdatedAt, createdAt, uuid } = props;
  const command = [config.command].concat(config.args).join(' ');
  return li(`.${styles.botListItem}`, { key: uuid }, [
    p([config.name]),
    p([command]),
  ]);
};
