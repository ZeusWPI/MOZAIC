import * as React from "react";
import { h, div, li, p, ul, form, label, input, button } from 'react-hyperscript-helpers';

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

export interface IPlayPageState { }

type PlayPageProps = IPlayPageStateProps & IPlayPageDispatchProps;

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export class PlayPage extends React.Component<PlayPageProps, IPlayPageState> {
  public render() {
    const { bots, selectedBots, selectBot, unselectBot } = this.props;
    return div(`.${styles.playPage}`, [
      h(BotsList, { bots, selectedBots, selectBot, unselectBot }),
      h(MatchSetup, {}),
    ]);
  }
}

// ----------------------------------------------------------------------------
// Config & Playing
// ----------------------------------------------------------------------------

interface IMatchSetupState {
  map: string;
  maxTurns: number;
}

interface IMatchSetupProps {

}

export class MatchSetup extends React.Component<IMatchSetupProps, IMatchSetupState> {
  constructor(props: IMatchSetupProps) {
    super(props);
    this.state = {
      map: '',
      maxTurns: 200,
    };
  }

  public render() {
    const map = div('.field', [
      label('.label', ['Map']),
      div('.control', [
        input('.input', {
          type: 'text',
          placeholder: 'TODO',
          value: this.state.map,
          onInput: (evt: any) => this.setState({ map: evt.target.value }),
        }),
      ]),
    ]);

    const maxTurns = div('.field', [
      label('.label', ['Max Turns']),
      div('.control', [
        input('.input', {
          type: 'number',
          placeholder: '200',
          value: this.state.maxTurns,
          onInput: (evt: any) => this.setState({ maxTurns: evt.target.value }),
        }),
      ]),
    ]);

    const playButton = div(`.${styles.playButton}`, [
      input('.button', { type: 'submit', value: 'Play' }),
    ]);

    return div(`.${styles.matchSetupPane}`, [
      p(`.${styles.setupHeader}`, ['Options']),
      form(`.${styles.options}`, { onSubmit: () => alert('TODO') }, [
        map,
        maxTurns,
        playButton,
      ]),
    ]);
  }
}

// ----------------------------------------------------------------------------
// Bots
// ----------------------------------------------------------------------------

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
      h(Link, { to: "/bots/" }, [
        li([p(['New Bot'])]),
      ]),
    ]);

    return div(`.${styles.botsListPane}`, [
      p(`.${styles.botsHeader}`, ['Bots']),
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
    { key: uuid, onClick: selector },
    [
      p(`.${styles.name}`, [config.name]),
      p(`.${styles.command}`, [command]),
    ]);
};
