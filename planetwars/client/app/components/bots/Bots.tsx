/**
 * Page for managing your bot scripts.
 */
/** */
import * as React from 'react';
import { Component } from 'react';
import { boundMethod } from 'autobind-decorator';

import * as M from '../../database/models';

// TODO import decently
// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

import * as css from './Bots.scss';

export interface BotOverviewStateProps {
  bots: M.BotList;
}

export type ConfigErrors = { name?: string, command?: string };

export interface BotOverviewDispatchProps {
  addBot: (name: string, command: string) => void;
  removeBot: (uuid: M.BotId) => void;
  editBot: (bot: M.Bot) => void;
  validate: (name: string, command: string) => ConfigErrors;
}

type BotOverviewProps = BotOverviewStateProps & BotOverviewDispatchProps;
/**
 * List of available bots
 */
export class BotOverview extends Component<BotOverviewProps> {

  public render() {
    const { bots } = this.props;
    const { removeBot, addBot, editBot, validate } = this.props;
    return (
      <div className={css.botPage}>
        <ul className={css.botOverview}>

          {/* All bot tiles */}
          {Object.values(bots).map((bot, index) =>
            <li key={index} className={css.botContainer}>
              <Bot {...{ bot, removeBot, editBot, validate }} />
            </li>,
          )}

          {/* Tile for adding a bot */}
          <li key="add" className={css.botContainer}>
            <AddBot {... { addBot, validate }} />
          </li>
        </ul>
      </div>);
  }

  @boundMethod
  public addBot(name: string, command: string) {
    this.props.addBot(name, command);
  }
}

export interface BotProps {
  bot: M.Bot;
  removeBot: (uuid: M.BotId) => void;
  editBot: (newBotData: M.Bot) => void;
  validate: (name: string, command: string) => ConfigErrors;
}

export interface BotState {
  isBeingEdited: boolean;
}
/**
 * Represents a single bot in [[BotOverview]]
 */
export class Bot extends Component<BotProps, BotState> {
  public state = { isBeingEdited: false };

  public render() {
    const { bot } = this.props;

    return (
      <div className={css.bot}>
        {
          (!this.state.isBeingEdited)
            ? <ShowBot bot={bot} onEdit={this.onEdit} onDelete={this.onDelete} />
            : <EditBot
              bot={bot}
              onSave={this.onSave}
              onDelete={this.onDelete}
              validate={this.props.validate}
            />
        }
      </div>
    );
  }

  @boundMethod
  private onEdit() { this.setState({ isBeingEdited: true }); }

  @boundMethod
  private onSave(bot: M.Bot) {
    this.setState({ isBeingEdited: false });
    this.props.editBot(bot);
  }

  @boundMethod
  private onDelete() { this.props.removeBot(this.props.bot.uuid); }
}

// ----------------------------------------------------------------------------
// Just showing the bot
// ----------------------------------------------------------------------------
export interface ShowBotProps {
  bot: M.Bot;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Static version of [[Bot]]
 * This is what is shown while the bot is not being edited
 */
export class ShowBot extends Component<ShowBotProps> {
  public render() {
    return (
      <div className={css.showBotView}>
        <div className={css.showContent}>
          <h1 className="is-size-1">{this.props.bot.name}</h1>
          <p className={css.command}>{this.props.bot.command}</p>
          <div className={css.controls}>
            <button className="button is-primary" onClick={this.props.onEdit}>Edit</button>
            <button className="button is-danger" onClick={this.props.onDelete}>Delete</button>
          </div>
        </div>
      </div>
    );
  }
}

// ----------------------------------------------------------------------------
// Editing the bot
// ----------------------------------------------------------------------------

export interface EditBotState {
  name: string;
  command: string;
  errors: any;
}

export interface EditBotProps {
  bot: M.Bot;
  onSave: (bot: M.Bot) => void;
  onDelete: () => void;
  validate: (name: string, command: string) => ConfigErrors;
}
/**
 * [[Bot]] renders this instead of [[ShowBot]] when it is being edited
 */
export class EditBot extends Component<EditBotProps, EditBotState> {
  constructor(props: EditBotProps) {
    super(props);
    this.state = {
      name: props.bot.name,
      command: props.bot.command,
      errors: {},
    };
  }

  public render() {
    return (
      <div className={css.editBotView}>
        <form onSubmit={this.onSubmit}>
          {/* Name */}
          <div className='field'>
            <label className='label'> Name </label>
            <div className='control'>
              <input
                className='input'
                type='text'
                placeholder='AwesomeBot3000'
                value={this.state.name}
                onChange={this.onChangeName}
              />
            </div>
          </div>

          {/* Command */}
          <div className='field'>
            <label className='label'> Command </label>
            <div className='control'>
              <input
                className='input'
                type='text'
                placeholder='The command to execute your bot'
                value={this.state.command}
                onChange={this.onChangeCommand}
              />
              <p className='help'>
                {JSON.stringify(stringArgv(this.state.command))}
              </p>
            </div>
            <label className='label'>
              Ex: python3 "/home/iK_BEN_DE_BESTE/bots/coolbot.py"
          </label>
            <label className='label'>
              USE ABSOLUTE PATHS
          </label>
          </div>

          {/* Controls */}
          <div className={css.controls}>
            <button className='button is-success' onClick={this.onSave}>Save</button>
            <button className='button is-warning' onClick={this.onReset}>Reset</button>
            <button className='button is-danger' onClick={this.onDelete}>Delete</button>
          </div>
        </form>
      </div>
    );
  }

  @boundMethod
  private onChangeName(evt: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ name: evt.target.value });
  }

  @boundMethod
  private onChangeCommand(evt: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ command: evt.target.value });
  }

  /**
   * This is triggered by default web form submit actions (like pressing enter)
   * @param evt React FormEvent object
   */
  @boundMethod
  private onSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    this.handleSubmit();
  }
  /**
   * This is triggered by actually pressing the save button
   * @param evt React FormEvent object
   */
  @boundMethod
  private onSave(evt: React.FormEvent) {
    evt.preventDefault();
    this.handleSubmit();
  }

  @boundMethod
  private onDelete(evt: React.FormEvent) {
    evt.preventDefault();
    this.props.onDelete();
  }

  @boundMethod
  private onReset(evt: React.FormEvent) {
    evt.preventDefault();
    this.setState({
      name: this.props.bot.name,
      command: this.props.bot.command,
      errors: {},
    });
  }

  private handleSubmit() {
    const { name, command } = this.state;
    const validation = this.props.validate(name, command);

    if (Object.keys(validation).length !== 0) {
      this.setState({ errors: validation });
      alert(JSON.stringify(validation)); // TODO Fix decently
      return;
    }

    this.props.onSave({ ...this.props.bot, name, command });
  }
}

// ----------------------------------------------------------------------------
// Adding a bot
// ----------------------------------------------------------------------------
export interface AddBotProps {
  addBot: (name: string, command: string) => void;
  validate: (name: string, command: string) => ConfigErrors;
}

export interface AddBotState {
  isBeingAdded: boolean;
}
/**
 * Component for adding a bot. Shows a plus button normally.
 * When clicked, state changes to isBeingAdded and an [[EditBot]] is rendered.
 */
export class AddBot extends Component<AddBotProps> {
  public state = { isBeingAdded: false };

  public render() {
    return (
      <div className={css.bot}>
        {
          (!this.state.isBeingAdded)
            ? <div className={css.add}><button onClick={this.onAdd}>+</button></div>
            : <EditBot
              bot={this.emptyBot()}
              onSave={this.onSave}
              onDelete={this.onDelete}
              validate={this.props.validate}
            />
        }
      </div>
    );
  }

  private emptyBot(): M.Bot {
    return {
      name: "",
      command: "",
      uuid: "",
      lastUpdatedAt: new Date(Date.now()),
      createdAt: new Date(Date.now()),
    };
  }

  @boundMethod
  private onAdd() {
    this.setState({ isBeingAdded: true });
  }

  @boundMethod
  private onSave(bot: M.Bot) {
    this.setState({ isBeingAdded: false });
    this.props.addBot(bot.name, bot.command);
  }

  @boundMethod
  private onDelete() {
    this.setState({ isBeingAdded: false });
  }
}
