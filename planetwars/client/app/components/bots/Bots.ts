import * as React from 'react';
import { h, div, p, li, ul, form, label, input, button } from "react-hyperscript-helpers";
// tslint:disable-next-line:no-var-requires
const split = require('split-string');

import { IBotConfig, IBotList, IBotData, BotID } from '../../utils/ConfigModels';
import { Link } from 'react-router-dom';

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface IBotsStateProps {
  bots: IBotList;
  selectedBot?: IBotData;
}

// tslint:disable-next-line:interface-over-type-literal
export type ConfigErrors = { name?: string, command?: string };

export interface IBotsFuncProps {
  addBot: (config: IBotConfig) => void;
  removeBot: (uuid: BotID) => void;
  editBot: (bot: IBotData) => void;
  validate: (config: IBotConfig) => ConfigErrors;
}

type IBotsProps = IBotsStateProps & IBotsFuncProps;

export class Bots extends React.Component<IBotsProps, {}> {

  public render() {
    const { bots, selectedBot, removeBot, addBot, editBot, validate } = this.props;
    return div(`.${styles.botPage}`, [
      div(`.${styles.bots}`, [
        h(BotsList, { bots }),
        h(BotEditor, { selectedBot, addBot, editBot, removeBot, validate }),
      ]),
    ]);
  }
}

// ----------------------------------------------------------------------------
// List of Bots
// ----------------------------------------------------------------------------

interface IBotListProps {
  bots: IBotList;
}

export class BotsList extends React.Component<IBotListProps, {}> {
  public render() {
    const bots = Object.keys(this.props.bots).map((uuid) => {
      return BotListItem(this.props.bots[uuid]);
    });
    return div(`.${styles.botsListPane}`, [
      h(NewBot),
      ul([bots]),
    ]);
  }
}
// tslint:disable-next-line:variable-name
export const NewBot: React.SFC<void> = (props) => {
  return div(`.${styles.newBot}`, [
    h(Link, { to: "/bots/" }, ["New Bot"]),
  ]);
};

// tslint:disable-next-line:variable-name
const BotListItem: React.SFC<IBotData> = (props) => {
  const { config, lastUpdatedAt, createdAt, uuid } = props;
  return h(Link, { to: `/bots/${uuid}`, key: uuid }, [
    li([p([config.name])]),
  ]);
};

// ----------------------------------------------------------------------------
// Bot details
// ----------------------------------------------------------------------------

interface IBotEditorProps {
  selectedBot?: IBotData;
  addBot: (bot: IBotConfig) => void;
  removeBot: (uuid: BotID) => void;
  editBot: (bot: IBotData) => void;
  validate: (config: IBotConfig) => ConfigErrors;
}

interface IBotEditorState {
  errors: any;
  selectedBot?: IBotData;
  command: string;
  name: string;
}

export class BotEditor extends React.Component<IBotEditorProps, IBotEditorState> {
  constructor(props: IBotEditorProps) {
    super(props);
    this.state = this.fromSelectedBot(props.selectedBot);
  }

  public componentWillReceiveProps(nextProps: IBotEditorProps) {
    this.setState(this.fromSelectedBot(nextProps.selectedBot));
  }

  public render() {
    const name = div('.field', [
      label('.label', ['Name']),
      div('.control', [
        input('.input', {
          type: 'text',
          placeholder: 'AwesomeBot3000',
          value: this.state.name,
          onInput: (evt: any) => this.setState({ name: evt.target.value }),
        }),
      ]),
    ]);

    const command = div('.field', [
      label('.label', ['Command']),
      div('.control', [
        input('.input', {
          type: 'text',
          placeholder: 'The command to execute your bot. Ex: python3 "~/bots/coolbot.py"',
          value: this.state.command,
          onInput: (evt: any) => this.setState({ command: evt.target.value }),
        }),
      ]),
    ]);

    const buttons = div('.control', [
      input('.button', { type: 'submit', value: 'Save' }),
      button('.button', {
        type: 'button',
        onClick: () => this.handleRemove(),
      }, ['Delete']),
    ]);

    return form(`.${styles.botEditor}`,
      {
        onSubmit: (evt: any) => this.handleSubmit(),
      }, [
        name,
        command,
        buttons,
      ]);
  }

  private handleSubmit() {
    const [command, ...args] = split(this.state.command);
    const { name, selectedBot } = this.state;
    const config = { name, command, args };
    const validation = this.props.validate(config);

    if (Object.keys(validation).length !== 0) {
      this.setState({ errors: validation });
      alert(JSON.stringify(validation)); // TODO Fix decently
      return;
    }

    if (selectedBot) {
      this.props.editBot({ config, ...selectedBot });
    } else {
      this.props.addBot(config);
    }
  }

  private handleRemove() {
    if (this.state.selectedBot) {
      this.props.removeBot(this.state.selectedBot.uuid);
    } else {
      this.setState({ name: '', command: '' });
    }
  }

  private fromSelectedBot(selectedBot?: IBotData) {
    if (!selectedBot) {
      return { selectedBot: undefined, name: '', command: '', errors: {} };
    }
    const { uuid, config: { name, command, args } } = selectedBot;
    const cmd = [command, ...args].join(' ');
    return { selectedBot, name, command: cmd, errors: {} };
  }
}
