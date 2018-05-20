import * as React from 'react';
import { Link } from 'react-router-dom';

import * as M from '../../database/models';

// TODO import decently
// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

export interface BotsStateProps {
  bots: M.BotList;
  selectedBot?: M.Bot;
}

export type ConfigErrors = { name?: string, command?: string };

export interface BotsDispatchProps {
  addBot: (name: string, command: string) => void;
  removeBot: (uuid: M.BotId) => void;
  editBot: (bot: M.Bot) => void;
  validate: (name: string, command: string) => ConfigErrors;
}

type BotsProps = BotsStateProps & BotsDispatchProps;

export class Bots extends React.Component<BotsProps, {}> {

  public render() {
    const { bots, selectedBot, removeBot, addBot, editBot, validate } = this.props;
    return (
      <div className={styles.botPage}>
        <div className={styles.bots}>
          <BotsList bots={bots} />
          <BotEditor
            selectedBot={selectedBot}
            addBot={addBot}
            removeBot={removeBot}
            editBot={editBot}
            validate={validate}
          />
        </div>
      </div>);
  }
}

// ----------------------------------------------------------------------------
// List of Bots
// ----------------------------------------------------------------------------

interface BotListProps {
  bots: M.BotList;
}

export class BotsList extends React.Component<BotListProps, {}> {
  public render() {
    const bots = Object.keys(this.props.bots).map((uuid) => {
      return BotListItem(this.props.bots[uuid]);
    });
    return (
      <div className={styles.botsListPane}>
        <NewBot />
        <ul> {bots} </ul>
      </div>
    );
  }
}

export const NewBot: React.SFC<{}> = (props) => {
  return (
    <div className={styles.newBot}>
      <Link to="/bots/"> New Bot </Link>
    </div>
  );
};

const BotListItem: React.SFC<M.Bot> = (props) => {
  const { name, lastUpdatedAt, createdAt, uuid } = props;
  return (
    <Link to={`/bots/${uuid}`} key={uuid}>
      <li>
        <p>
          {name}
        </p>
      </li>
    </Link>
  );
};

// ----------------------------------------------------------------------------
// Bot details
// ----------------------------------------------------------------------------

interface BotEditorProps {
  selectedBot?: M.Bot;
  addBot: (name: string, command: string) => void;
  removeBot: (uuid: M.BotId) => void;
  editBot: (bot: M.Bot) => void;
  validate: (name: string, command: string) => ConfigErrors;
}

interface BotEditorState {
  errors: any;
  selectedBot?: M.Bot;
  command: string;
  name: string;
}

export class BotEditor extends React.Component<BotEditorProps, BotEditorState> {
  public state: BotEditorState = { command: '', name: '', errors: {} };

  public static getDerivedStateFromProps(nextProps: BotEditorProps, prevState: BotEditorState): BotEditorState {
    if (!nextProps.selectedBot) {
      return { selectedBot: undefined, name: '', command: '', errors: {} };
    }
    const { name, command } = nextProps.selectedBot;
    return { name, command, selectedBot: nextProps.selectedBot, errors: {} };
  }

  public render() {
    console.log(this.state.name);
    const onNameInput = (evt: any) => this.setState({ name: evt.target.value });
    const name = (
      <div className='field'>
        <label className='label'> Name </label>
        <div className='control'>
          <input
            className='input'
            type='text'
            placeholder='AwesomeBot3000'
            value={this.state.name}
            onInput={onNameInput}
          />
        </div>
      </div>
    );

    const onCommandInput = (evt: any) => {
      this.setState({ command: evt.target.value });
    };
    const command = (
      <div className='field'>
        <label className='label'> Command </label>
        <div className='control'>
          <input
            className='input'
            type='text'
            placeholder='The command to execute your bot'
            value={this.state.command}
            onInput={onCommandInput}
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
      </div>
    );

    const handleRemove = () => this.handleRemove();

    const buttons = (
      <div className='control'>
        <input className='button' type='submit' value='Save' />
        <button
          className='button'
          type='button'
          onClick={handleRemove}
        >
          Delete
        </button>
      </div>
    );

    const onSubmit = (evt: React.FormEvent<{}>) => {
      evt.preventDefault();
      this.handleSubmit();
    };

    return (
      <form className={styles.botEditor} onSubmit={onSubmit}>
        {name}
        {command}
        {buttons}
      </form>
    );
  }

  private handleSubmit() {
    const { name, selectedBot, command } = this.state;
    const validation = this.props.validate(name, command);

    if (Object.keys(validation).length !== 0) {
      this.setState({ errors: validation });
      alert(JSON.stringify(validation)); // TODO Fix decently
      return;
    }
    if (selectedBot) {
      this.props.editBot({ ...selectedBot, name, command });
    } else {
      this.props.addBot(name, command);
    }
  }

  private handleRemove() {
    if (this.state.selectedBot) {
      this.props.removeBot(this.state.selectedBot.uuid);
    } else {
      this.setState({ name: '', command: '' });
    }
  }
}
