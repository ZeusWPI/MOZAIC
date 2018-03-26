import * as React from "react";
import { h, div, li, p, ul, form, label, input, button, span, i, select, option } from 'react-hyperscript-helpers';

import { IBotConfig, IBotList, IBotData, BotID, IMatchConfig } from '../../utils/ConfigModels';
import { Link } from "react-router-dom";
import { text } from "d3";
import { IMapList } from "../../utils/GameModels";
import { MatchParams } from '../../actions/actions';


// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface IPlayPageStateProps {
  bots: IBotList;
  maps: IMapList;
  selectedBots: BotID[];
}

export interface IPlayPageDispatchProps {
  importMatch: (fileList: FileList) => void;
  selectBot: (uuid: string) => void;
  unselectBot: (uuid: string, all: boolean) => void;
  runMatch: (params: MatchParams) => void;
}

export interface IPlayPageState { }

type PlayPageProps = IPlayPageStateProps & IPlayPageDispatchProps;

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export class PlayPage extends React.Component<PlayPageProps, IPlayPageState> {

  public render() {
    const { bots, selectedBots, selectBot,
      unselectBot, importMatch, maps, runMatch } = this.props;
    return div(`.${styles.playPage}`, [
      h(BotsList, { bots, selectedBots, selectBot, unselectBot }),
      h(MatchSetup, { bots, selectedBots, unselectBot, importMatch, maps, runMatch }),
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
  selectedBots: BotID[];
  bots: IBotList;
  maps: IMapList;
  unselectBot: (uuid: string, all: boolean) => void;
  importMatch: (fileList: FileList) => void;
  runMatch: (params: MatchParams) => void;
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
    const { bots, selectedBots, unselectBot } = this.props;

    const maps = Object.keys(this.props.maps).map((uuid) => {
      const _map = this.props.maps[uuid];
      return option({ value: _map.uuid, label: _map.name });
    }).concat(option({ value: '', label: 'Select Map' }));

    const map = div([
      label('.label', { key: 'map' }, ['Map']),
      div('.field.has-addons', [
        div('.control', [
          div('.select', [
            select({
              type: 'text',
              placeholder: 'TODO',
              value: this.state.map,
              onInput: (evt: any) => this.setState({ map: evt.target.value }),
            }, maps),
          ]),
        ]),
        // https://bulma.io/documentation/form/file/
        div('.control', [
          div('.file', [
            label('.file-label', [
              input('.file-input', {
                type: 'file',
                name: 'map',
                onChange: (evt: any) => this.importMatch(evt.target.files),
              }),
              span('.file-cta', [
                span('.file-icon', [i('.fa.fa-upload')]),
                span('.file-label', [span('.file-label', ['Import'])]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    const maxTurns = div('.field', [
      label('.label', ['Max Turns']),
      div('.control', [
        input('.input', {
          type: 'number',
          placeholder: '200',
          value: this.state.maxTurns,
          onInput: (evt: any) => this.setState({ maxTurns: parseInt(evt.target.value, 10) }),
          onChange: (evt: any) => this.setState({ maxTurns: parseInt(evt.target.value, 10) }),
        }),
      ]),
    ]);

    const playButton = div(`.${styles.playButton}`, [
      input('.button', { type: 'submit', value: 'Play' }),
    ]);

    return div(`.${styles.matchSetupPane}`, [
      p(`.${styles.setupHeader}`, ['Options']),
      h(SelectedBotsOverview, { bots, selectedBots, unselectBot }),
      form(`.${styles.options}`,
        {
          onSubmit: (evt: Event) => {
            evt.preventDefault();
            this.play();
          },
        },
        [
          map,
          maxTurns,
          playButton,
        ]),
    ]);
  }

  private play(): void {
    console.log(this.state);
    if (!this.state.map) {
      alert('Please select a map');
      return;
    }
    const turns = this.state.maxTurns || 200;
    const map = this.props.maps[this.state.map];

    if (map.slots < this.props.selectedBots.length) {
      alert('Not enough slots in the map');
      return;
    }

    const players = this.props.selectedBots.map(
      (uuid) => this.props.bots[uuid].config,
    );

    this.props.runMatch({
      bots: this.props.selectedBots,
      map: this.state.map,
      max_turns: turns,
    });
  }

  private importMatch(fileList: FileList): void {
    this.props.importMatch(fileList);
  }
}

interface ISelectedBotsProps {
  selectedBots: BotID[];
  bots: IBotList;
  unselectBot: (uuid: string, all: boolean) => void;
}

// tslint:disable-next-line:variable-name
export const SelectedBotsOverview: React.SFC<ISelectedBotsProps> = (props) => {
  const { selectedBots, bots } = props;

  const tags = selectedBots.map((uuid) => {
    return div(`.${styles.botTag}`, { key: uuid }, [span(bots[uuid].config.name)]);
  });

  return div(`.${styles.selectedBotsOverview}`, tags); // TODO: Add remove all
};

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
