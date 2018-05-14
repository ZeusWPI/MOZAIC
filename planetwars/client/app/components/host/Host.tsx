import * as React from "react";

import * as M from '../../utils/database/models';
import {ExternalBotSlot} from "../../utils/database/migrationV4";
import BotSelector from './BotSelector';
import { AddressForm } from "./AddressForm";

// tslint:disable-next-line:no-var-requires
const styles = require("./Host.scss");

export interface HostStateProps {
  bots: M.BotList;
  maps: M.MapList;
  selectedBots: M.BotSlot[];
  // selectedMap: string;
}

export interface HostDispatchProps {
  newBotSlots: (amount: number) => void;
  runMatch: (params: M.MatchParams) => void;
  toggleConnected: (bot: M.BotSlot) => void;

  changeBotSlot: (slot: M.BotSlot) => void;
  // selectMap: (id: string) => void;
}

export interface HostState {
  selectedMap?: M.MapId;
  mapToggled: boolean;
  maxTurns: number;
  address: M.Address;
}

export type HostProps = HostStateProps & HostDispatchProps;

export class Host extends React.Component<HostProps, HostState> {
  constructor(props: HostProps) {
    super(props);
    this.state = {
      mapToggled: false,
      maxTurns: 500,
      address: {
        host: '127.0.0.1',
        port: 9142,
      },
    };
    this.setAddress = this.setAddress.bind(this);
  }

  public render() {
    const toggle = (evt: any) => this.setState({mapToggled: true});
    const setMaxTurns = (evt: any) => this.setMaxTurns(evt.target.value);
    return (
      <div id={styles.host}>
        <div className={styles.header}>
          <h1 className="title is-1">> Set up Host Game_ </h1>
        </div>
        <div className={this.props.selectedBots.length > 0 ? styles.hidden : styles.mapSelection}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">1</span>
            <span className={styles.tagInfoText}> Pick a Map</span>
          </h2>

          <MapSelector
            maps={this.props.maps}
            selectMap={this.selectMap}
            selectedMap={this.state.selectedMap}
          />
          <div className={styles.mapPreview}>
            <figure className="image is-128x128">
              <img src="https://bulma.io/images/placeholders/128x128.png"/>
            </figure>
          </div>

          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">3</span>
            <span className={styles.tagInfoText}> Set turn limit</span>
          </h2>

          <div className={styles.maxTurns}>
            <span className={styles.header}>Max Turns</span>
            <input type="text" defaultValue={this.state.maxTurns.toString()} onBlur={setMaxTurns}/>
          </div>

          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">4</span>
            <span className={styles.tagInfoText}> Check ip and port </span>
          </h2>

          <AddressForm address={this.state.address} onChange={this.setAddress}/>

          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">5</span>
            <span className={styles.tagInfoText}> Start server</span>
          </h2>

          <button className="button" onClick={this.startServer}>
            Go!
          </button>
        </div>
        <div id={styles.botList} className={this.props.selectedBots.length ? "" : styles.hidden}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">6</span>
            <span className={styles.tagInfoText}> Wait for people to join...</span>
          </h2>

          <BotSlots
            selectedBots={this.props.selectedBots}
            allBots={this.props.bots}
            updateSlot={this.updateSlot}
            toggleConnected={this.props.toggleConnected}
          />

          <button className="button" onClick={this.startSignal}>
            Start!
          </button>
        </div>
      </div>
    );
  }

  private updateSlot = (slot: M.BotSlot) => {
    this.props.changeBotSlot(slot);
  }

  private startSignal = () => {
    const notConnected = this.props.selectedBots.filter((bot) => !bot.connected);
    const amount = notConnected.length;
    if (amount > 0) {
      alert("Waiting for " + amount + " more player" + (amount === 1 ? "" : "s") + " to join...");
      return;
    }
    alert("Send go to server");
  }

  private setAddress(address: M.Address) {
    this.setState({address});
  }

  private setMaxTurns = (maxTurns: string) => {
    const turns: number = parseInt(maxTurns, 10);
    this.setState(
      {
        ...this.state,
        maxTurns: turns,
      },
    );
  }

  private startServer = () => {
    if (!this.state.selectedMap) {
      alert('Please pick a map!');
      return;
    }
    // TODO: make sure this is correct (it isn't currently for Large)
    this.props.newBotSlots(this.props.maps[this.state.selectedMap].slots);

    const config: M.MatchParams = {
      players: this.props.selectedBots,
      map: this.state.selectedMap,
      maxTurns: this.state.maxTurns,
      address: this.state.address,
    };

    alert("Start server on " + config.address.host + ":" + config.address.port +
          " with " + this.props.maps[this.state.selectedMap].slots + " players, map " +
          config.map + " and a maximum of " + config.maxTurns + " turns");
    // console.log(config);
    // this.props.runMatch(config);
  }

  private selectMap = (id: M.MapId) => {
    this.setState({selectedMap: id});
  }

  // private addInternal = () => {
  //   this.selectBotInternal("", "");
  // }
}

interface BotSlotsProps {
  selectedBots: M.BotSlot[];
  allBots: M.BotList;
  updateSlot: (slot: M.BotSlot) => void;
  toggleConnected: (bot: M.BotSlot) => void;
}

export const BotSlots: React.SFC<BotSlotsProps> = (props) => {
  const slots = props.selectedBots.map((slot, idx) => {
    return (
      <Slot
        key={idx}
        bot={slot}
        allBots={props.allBots}
        updateSlot={props.updateSlot}
        toggleConnected={props.toggleConnected}
      />
    );
  });
  return <ul>{slots}</ul>;
};

interface SlotProps {
  bot: M.BotSlot;
  allBots: M.BotList;
  updateSlot: (slot: M.BotSlot) => void;
  toggleConnected: (bot: M.BotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    const { bot, allBots, updateSlot } = this.props;
    switch (bot.type) {
      case 'internal':
        return (
          <div>
            <span
              className={"tag is-small is-rounded " + (
                this.props.bot.connected ?
                "is-success" :
                "is-danger"
              )}
              onClick={this.toggleConnected}
            />
            <InternalSlot slot={bot} allBots={allBots} setSlot={updateSlot} makeExternal={this.makeExternal}/>;
          </div>
        );
      case 'external':
        return (
          <div>
            <span
              className={"tag is-small is-rounded " + (
                this.props.bot.connected ?
                "is-success" :
                "is-danger"
              )}
              onClick={this.toggleConnected}
            />
            <ExternalSlot slot={bot} setSlot={updateSlot} makeInternal={this.makeInternal}/>;
          </div>
        );
    }
  }

  private toggleConnected = () => {
    this.props.toggleConnected(this.props.bot);
  }

  private makeExternal = () => {
    const newSlot = this.props.bot;
    newSlot.type = 'external';
    this.props.updateSlot(newSlot);
  }

  private makeInternal = () => {
    const newSlot = this.props.bot;
    newSlot.type = 'internal';
    this.props.updateSlot(newSlot);
  }
}

export interface InternalSlotProps {
  slot: M.InternalBotSlot;
  allBots: M.BotList;
  setSlot: (slot: M.InternalBotSlot) => void;
  makeExternal: () => void;
}

export class InternalSlot extends React.Component<InternalSlotProps> {

  constructor(props: InternalSlotProps) {
    super(props);
    this.setBot = this.setBot.bind(this);
    this.setName = this.setName.bind(this);
  }

  public render() {
    const { slot, allBots } = this.props;
    return (
      <div>
        <BotSelector bots={allBots} value={slot.botId} onChange={this.setBot}/>
        <button onClick={this.joinLocal} disabled={this.props.slot.connected}>Join</button>
        Name:{" "}
        <input
          type="text"
          placeholder="bot name"
          value={this.props.slot.name}
          onChange={this.setName}
        />
        <button onClick={this.props.makeExternal} disabled={this.props.slot.connected}>Make external</button>
      </div>
    );
  }

  private joinLocal = () => {
    const { slot, allBots } = this.props;
    if (!slot.botId) {
      alert("Please select a bot first.");
      return;
    }
    alert("Joining with bot " + allBots[slot.botId].name + " with token " + slot.token);
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

  private setName(evt: any) {
    const name: string = evt.target.value;
    const { slot, setSlot } = this.props;
    setSlot({ ...slot, name });
  }
}

export interface ExternalSlotProps {
  slot: M.ExternalBotSlot;
  setSlot: (slot: M.ExternalBotSlot) => void;
  makeInternal: () => void;
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
        <button onClick={this.props.makeInternal} disabled={this.props.slot.connected}>Make internal</button>
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
      {props.maps[key].name + " (" + props.maps[key].slots + " players)"}
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
