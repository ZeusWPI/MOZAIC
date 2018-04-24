import * as React from "react";

import * as M from '../../utils/database/models';

// tslint:disable-next-line:no-var-requires
const styles = require("./Host.scss");

export interface HostStateProps {
  bots: M.BotList;
  maps: M.MapList;
  // selectedBots: M.BotSlot[];
  // selectedMap: string;
}

export interface HostDispatchProps {
  // selectBotInternal: (name: string, id: M.BotId) => void;
  // selectBotExternal: (name: string) => void;
  // unselectBot: (uuid: string, all: boolean) => void;
  runMatch: (params: M.MatchParams) => void;
  generateToken(): string;
  // changeLocalBot: (token: M.Token, slot: M.BotSlot) => void;
  // selectMap: (id: string) => void;
}

export interface HostState {
  selectedBots: M.BotSlot[];
  selectedMap: string;
  mapToggled: boolean;
}

export type HostProps = HostStateProps & HostDispatchProps;

export class Host extends React.Component<HostProps, HostState> {
  public render() {
    const toggle = (evt: any) => this.setState({ mapToggled: true });
    return (
      <div id={styles.host}>
        <div className={styles.header}>
          <h1 className="title is-1">> Set up Host Game_ </h1>
        </div>
        <div id={styles.addBotButtons}>
          <h2 className="title is-5 ">
            <span className="tag is-info is-small is-rounded">1</span>
            <span className={styles.tagInfoText}> Add one or more bots</span>
          </h2>
          <button
            className="button is-success is-outlined"
            onClick={this.addInternal}
          >
            <span className="icon is-small">
              <i className="fa fa-hand-spock-o" />
            </span>
            <span>My Bot</span>
          </button>

          <p> Add one of your own bots to the game </p>

          <button
            className="button is-success is-outlined"
            onClick={this.addExternal}
          >
            <span className="icon is-small">
              <i className="fa fa-hand-scissors-o" />
            </span>
            <span>External Bot</span>
          </button>
          <p> Add an external bots to the game </p>
        </div>
        <div id={styles.botList}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">2</span>
            <span className={styles.tagInfoText}> Config selected bots</span>
          </h2>

          <BotSlots
            selectedBots={this.state.selectedBots}
            allBots={this.props.bots}
            updateSlot={this.updateSlot}
          />
        </div>
        <div id={styles.mapSelector}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">3</span>
            <span className={styles.tagInfoText}> Pick a Map</span>
          </h2>

          <MapSelector
            maps={this.props.maps}
            selectMap={this.selectMap}
            selectedMap={this.state.selectedMap}
          />
          <div className={styles.mapPreview}>
            <figure className="image is-128x128">
              <img src="https://bulma.io/images/placeholders/128x128.png" />
            </figure>
          </div>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">4</span>
            <span className={styles.tagInfoText}> Play!</span>
          </h2>

          <button className="button" onClick={this.startServer}>
            Play!
          </button>
        </div>
      </div>
    );
  }

  private startServer = () => {
    const config: M.MatchParams = {
      players: this.state.selectedBots,
      map: this.state.selectedMap,
      maxTurns: 500,
    };
    console.log(config);
    this.props.runMatch(config);
  }

  // TODO: Check if correct
  private selectBotInternal = (name: string, botId: M.BotId) => {
    const token = this.props.generateToken();
    const botSlot: M.BotSlot = { type: 'internal', botId, name, token };
    this.setState({
      ...this.state,
      selectedBots: [...this.state.selectedBots, botSlot],
    });
  }

  private selectBotExternal = (name: string) => {
    const token = this.props.generateToken();
    const botSlot: M.BotSlot = { type: 'external', name, token };
    this.setState({
      ...this.state,
      selectedBots: [...this.state.selectedBots, botSlot],
    });
  }

  private updateSlot = (index: number, slot: M.BotSlot) => {
    throw new Error('Not implemented');
  }

  private selectMap = (id: M.MapId) => {
    throw new Error('Not implemented');
  }

  private addInternal = () => {
    this.selectBotInternal("My Bot", "");
  }

  private addExternal = () => {
    this.selectBotExternal("My Enemy's Bot");
  }
}

interface BotSlotsProps {
  selectedBots: M.BotSlot[];
  allBots: M.BotList;
  updateSlot: (index: number, slot: M.BotSlot) => void;
}

export const BotSlots: React.SFC<BotSlotsProps> = (props) => {
  const slots = props.selectedBots.map((slot, idx) => {
    return (
      <Slot
        key={idx}
        bot={slot}
        allBots={props.allBots}
        token={slot.token}
        updateSlot={props.updateSlot}
      />
    );
  });
  return <ul>{slots}</ul>;
};

interface SlotProps {
  bot: M.BotSlot;
  allBots: M.BotList;
  token: M.Token;
  updateSlot: (index: number, slot: M.BotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    let extra;
    if (this.props.bot.type === 'internal') {
      const options = Object.keys(this.props.allBots).map((uuid, i) => {
        return (
          <option value={uuid} key={i}>
            {" "}
            {this.props.allBots[uuid].name}{" "}
          </option>
        );
      });
      extra = (
        <div>
          <select value={this.props.bot.botId} onChange={this.changeBotID}>
            <option value="">Select Bot</option>
            {options}
          </select>
          (token: {this.props.token})
        </div>
      );
    } else {
      extra = <div>token: {this.props.token}</div>;
    }
    return (
      <li>
        Name:{" "}
        <input
          type="text"
          defaultValue={this.props.bot.name}
          onBlur={this.changeBotName}
        />
        {extra}
      </li>
    );
  }

  private changeBotID = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    throw new Error('Not implemented!');
    // const id: M.BotId = evt.target.value;
    // const newBot = this.props.bot as M.InternalBotSlot;
    // newBot. = id;
    // this.props.changeLocalBot(this.props.token, newBot);
  }

  private changeBotName(evt: any) {
    throw new Error('Not implemented!');
    // const name: string = evt.target.value;
    // const newBot = this.props.bot;
    // newBot.name = name;
    // this.props.updateSlot(this.props.token, newBot);
  }
}

interface MapSelectorProps {
  maps: M.MapList;
  selectMap: (id: string) => void;
  selectedMap: string;
}

export const MapSelector: React.SFC<MapSelectorProps> = (props) => {
  const mapElements = Object.keys(props.maps).map((key, idx) => (
    <option value={key} key={idx}>
      {props.maps[key].name}
    </option>
  ));
  const handleChange = (evt: any) => props.selectMap(evt.target.value);
  mapElements.unshift(<option value="">Select Map</option>);
  return (
    <select
      id={styles.mapSelector}
      value={props.selectedMap}
      onChange={handleChange}
    >
      {mapElements}
    </select>
  );
};
