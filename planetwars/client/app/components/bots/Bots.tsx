import * as React from 'react';
import { h, div, p, li, ul, form, label, input, button } from "react-hyperscript-helpers";
// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

import { IBotConfig, IBotList, IBotData, BotID } from '../../utils/ConfigModels';
import { Link } from 'react-router-dom';

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface BotsStateProps {
  bots: IBotList;
  selectedBot?: IBotData;
}

// tslint:disable-next-line:interface-over-type-literal
export type ConfigErrors = { name?: string, command?: string };

export interface BotsDispatchProps {
  addBot: (config: IBotConfig) => void;
  removeBot: (uuid: BotID) => void;
  editBot: (bot: IBotData) => void;
  validate: (config: IBotConfig) => ConfigErrors;
}

type IBotsProps = BotsStateProps & BotsDispatchProps;

export class Bots extends React.Component<IBotsProps, {}> {

  public render() {
    const { bots, selectedBot, removeBot, addBot, editBot, validate } = this.props;
    return <div className={styles.botPage}>
      <div className={styles.bots}>
        <BotsList bots={bots}/>
        <BotEditor
          selectedBot={selectedBot}
          addBot={addBot}
          removeBot={removeBot}
          editBot={editBot}
          validate={validate}
        />
      </div>
    </div>;
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
    return <div className={styles.botsListPane}>
      <NewBot/>
      <ul> {bots} </ul>
    </div>;
  }
}
// tslint:disable-next-line:variable-name
export const NewBot: React.SFC<{}> = (props) => {
  return <div className={styles.newBot}>
    <Link to="/bots/"> New Bot </Link>
  </div>;
};

// tslint:disable-next-line:variable-name
const BotListItem: React.SFC<IBotData> = (props) => {
  const { config, lastUpdatedAt, createdAt, uuid } = props;
  return <Link to={`/bots/${uuid}`} key={uuid}>
    <li>
      <p>
        {config.name}
      </p>
    </li>
  </Link>;
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
    const name = <div className='field'>
      <label className='label'> Name </label>
      <div className='control'>
        <input
          className='input'
          type='text'
          placeholder='AwesomeBot3000'
          value={this.state.name}
          onInput={(evt: any) => this.setState({ name: evt.target.value })}
        />
      </div>
    </div>;
    
    div('.field', [
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

    const command = <div className='field'>
      <label className='label'> Command </label>
      <div className='control'>
        <input
          className='input'
          type='text'
          placeholder='The command to execute your bot'
          value={this.state.command}
          onInput={(evt: any) => this.setState({command: evt.target.value})}
        />
        <p className='help'>
          {JSON.stringify(stringArgv(this.state.command))}
        </p>
      </div>
      <label className='label'>
        Ex: python3 "/home/iK_BEN_DE_BESTE/bots/coolbot.py
      </label>
      <label className='label'>
        USE ABSOLUTE PATHS
      </label>
    </div>;

    const buttons = <div className='control'>
      <input className='button' type='submit' value='Save'/>
      <button
        className='button'
        type='button'
        onClick={() => this.handleRemove()}>
        Delete
      </button>
    </div>;

    const onSubmit = (evt: React.FormEvent<{}>) => {
      evt.preventDefault();
      this.handleSubmit();
    };

    return <form className={styles.botEditor} onSubmit={onSubmit}>
      {name}
      {command}
      {buttons}
    </form>;
  }

  private handleSubmit() {
    const [command, ...args] = stringArgv(this.state.command);
    const { name, selectedBot } = this.state;
    const config = { name, command, args };
    const validation = this.props.validate(config);

    if (Object.keys(validation).length !== 0) {
      this.setState({ errors: validation });
      alert(JSON.stringify(validation)); // TODO Fix decently
      return;
    }

    if (selectedBot) {
      this.props.editBot({ ...selectedBot, config });
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
