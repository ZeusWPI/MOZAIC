import * as React from "react";

import * as M from '../../utils/database/models';
import {ExternalBotSlot} from "../../utils/database/migrationV4";

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
  selectedMap?: M.MapId;
  mapToggled: boolean;
  maxTurns: number;
}

export type HostProps = HostStateProps & HostDispatchProps;

export class Host extends React.Component<HostProps, HostState> {
  public state: HostState = {selectedBots: [], mapToggled: false, maxTurns: 500};

  public render() {
    const toggle = (evt: any) => this.setState({mapToggled: true});
    const setMaxTurns = (evt: any) => this.setMaxTurns(evt.target.value);
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
              <i className="fa fa-hand-spock-o"/>
            </span>
            <span>My Bot</span>
          </button>

          <p> Add one of your own bots to the game </p>

          <button
            className="button is-success is-outlined"
            onClick={this.addExternal}
          >
            <span className="icon is-small">
              <i className="fa fa-hand-scissors-o"/>
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
        <div className={styles.mapSelection}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">3</span>
            <span className={styles.tagInfoText}> Pick a Map</span>
          </h2>

          <MapSelector
            maps={this.props.maps}
            selectMap={this.selectMap}
            selectedMap={this.state.selectedMap}
          />

          <div className={styles.maxTurns}>
            <span className={styles.header}>Max Turns</span>
            <input type="text" defaultValue={this.state.maxTurns.toString()} onBlur={setMaxTurns}/>

          </div>
          <div className={styles.mapPreview}>
            <figure className="image is-128x128">
              <img src="https://bulma.io/images/placeholders/128x128.png"/>
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

  private setMaxTurns = (maxTurns: string) => {
    let turns: number = parseInt(maxTurns);
    this.setState(
      {
        ...this.state,
        maxTurns: turns,
      }
    )

  };

  private startServer = () => {
    if (!this.state.selectedMap) {
      alert('Please pick a map!');
      return;
    }
    const config: M.MatchParams = {
      players: this.state.selectedBots,
      map: this.state.selectedMap,
      maxTurns: this.state.maxTurns,
    };
    console.log(config);
    this.props.runMatch(config);
  }

  // TODO: Check if correct
  private selectBotInternal = (name: string, botId: M.BotId) => {
    const token = this.props.generateToken();
    const botSlot: M.BotSlot = {type: 'internal', botId, name, token};
    this.setState({
      ...this.state,
      selectedBots: [...this.state.selectedBots, botSlot],
    });
  }

  private selectBotExternal = (name: string) => {
    const token = this.props.generateToken();
    const botSlot: M.BotSlot = {type: 'external', name, token};
    this.setState({
      ...this.state,
      selectedBots: [...this.state.selectedBots, botSlot],
    });
  }

  private updateSlot = (index: number, slot: M.BotSlot) => {
    this.setState((state) => {
      state.selectedBots[index] = slot;
      return state;
    });
  }

  private selectMap = (id: M.MapId) => {
    this.setState({selectedMap: id});
  }

  private addInternal = () => {
    this.selectBotInternal("", "");
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
    const updateSlot = (s: M.BotSlot) => props.updateSlot(idx, s);
    return (
      <Slot
        key={idx}
        bot={slot}
        allBots={props.allBots}
        updateSlot={updateSlot}
      />
    );
  });
  return <ul>{slots}</ul>;
};

interface SlotProps {
  bot: M.BotSlot;
  allBots: M.BotList;
  updateSlot: (slot: M.BotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    const { bot, allBots, updateSlot } = this.props;
    switch (bot.type) {
      case 'internal':
        return <InternalSlot slot={bot} allBots={allBots} setSlot={updateSlot}/>;
      case 'external':
        return <ExternalSlot slot={bot} setSlot={updateSlot}/>;
    }
  }
}


export interface InternalSlotProps {
  slot: M.InternalBotSlot;
  allBots: M.BotList;
  setSlot: (slot: M.InternalBotSlot) => void;
}

export class InternalSlot extends React.Component<InternalSlotProps> {

  public render() {
    const options = Object.keys(this.props.allBots).map((uuid) => {
      return (
        <option value={uuid} key={uuid}>
          {this.props.allBots[uuid].name}
        </option>
      );
    });

    const setBot = (e: any) => this.setBot(e.target.value);
    const setName = (e: any) => this.setName(e.target.value);
    return (
      <div>
        <select value={this.props.slot.botId} onChange={setBot}>
            <option value="">Select Bot</option>
            {options}
        </select>
        Name:{" "}
        <input
          type="text"
          placeholder="bot name"
          value={this.props.slot.name}
          onChange={setName}
        />
      </div>
    );
  }

  private setBot(botId: M.BotId) {
    const { slot, allBots, setSlot } = this.props;

    let name = slot.name;
    if (!name) {
      name = allBots[botId].name;
    }
    if (slot.botId && name === allBots[slot.botId].name) {
      name = allBots[botId].name;
    }

    setSlot({ ...slot, botId, name});
  }

  private setName(name: string) {
    const { slot, setSlot } = this.props;
    setSlot({ ...slot, name });
  }
}

export interface ExternalSlotProps {
  slot: M.ExternalBotSlot,
  setSlot: (slot: M.ExternalBotSlot) => void

}

export class ExternalSlot extends React.Component<ExternalSlotProps> {
  public render() {
    const setName = (e: any) => this.changeBotName(e.target.value);
    return (
      <li>
        Name:{" "}
        <input
          type="text"
          defaultValue={this.props.slot.name}
          onBlur={setName}
        />
        <div>token: {this.props.slot.token}</div>;
      </li>
    );
  }

  private changeBotName(name: string) {
    const newSlot = this.props.slot;
    newSlot.name = name;
    this.props.setSlot(newSlot);
  }
}

interface MapSelectorProps {
  maps: M.MapList;
  selectMap: (id: string) => void;
  selectedMap?: string;
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
