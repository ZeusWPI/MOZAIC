import * as React from "react";

import * as M from '../../utils/database/models';
import {ExternalBotSlot} from "../../utils/database/migrationV4";
import BotSelector from './BotSelector';
import { AddressForm } from "./AddressForm";
import * as classnames from 'classnames';

// tslint:disable-next-line:no-var-requires
const styles = require("./Host.scss");

export interface HostStateProps {
  bots: M.BotList;
  maps: M.MapList;
  selectedBots: M.BotSlot[];
  ctrlToken: M.Token;
  serverShouldStart: boolean;
  // selectedMap: string;
}

export interface HostDispatchProps {
  setupServer: (params: M.ServerParams) => void;
  startServer: () => void;
  toggleConnected: (bot: M.BotSlot) => void;
  changeBotSlot: (slot: M.BotSlot) => void;
  sendGo: () => void;
  joinMatch: (address: M.Address, slot: M.InternalBotSlot) => void;

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
    if (this.props.serverShouldStart) {
      this.props.startServer();
    }
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

          <button className="button" onClick={this.setupServer}>
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
            joinMatch={this.joinMatch}
          />

          <button className="button" onClick={this.startSignal}>
            Start!
          </button>
        </div>
      </div>
    );
  }

  private joinMatch = (slot: M.InternalBotSlot) => {
    this.props.joinMatch(this.state.address, slot);
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
    this.props.sendGo();
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

  private setupServer = () => {
    if (!this.state.selectedMap) {
      alert('Please pick a map!');
      return;
    }
    const config: M.ServerParams = {
      numPlayers: this.props.maps[this.state.selectedMap].slots,
      maxTurns: this.state.maxTurns,
      mapId: this.state.selectedMap,
      address: this.state.address,
    };
    this.props.setupServer(config);
  }

  private selectMap = (id: M.MapId) => {
    this.setState({selectedMap: id});
  }
}

interface BotSlotsProps {
  selectedBots: M.BotSlot[];
  allBots: M.BotList;
  updateSlot: (slot: M.BotSlot) => void;
  toggleConnected: (bot: M.BotSlot) => void;
  joinMatch: (slot: M.InternalBotSlot) => void;
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
        joinMatch={props.joinMatch}
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
  joinMatch: (slot: M.InternalBotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    const { bot, allBots, updateSlot } = this.props;

    let slot;
    switch (bot.type) {
      case 'internal':
        slot = (
          <InternalSlot
            slot={bot}
            allBots={allBots}
            setSlot={updateSlot}
            makeExternal={this.makeExternal}
            joinMatch={this.props.joinMatch}
          />
        );
        break;
      case 'external':
        slot = <ExternalSlot slot={bot} setSlot={updateSlot} makeInternal={this.makeInternal}/>;
        break;
    }

    return (
      <div>
        <span
          className={"tag is-small is-rounded " + (
            this.props.bot.connected ?
            "is-success" :
            "is-danger is-loading"
          )}
          onClick={this.toggleConnected}
        >
        <FaIcon
          icon={this.props.bot.connected ? "check" : "spinner"}
          className={this.props.bot.connected ? "" : styles.rotate}
        />
        </span>
        Name:{" "}
        <input
          type="text"
          defaultValue={this.props.bot.name}
          onBlur={this.setName}
        />
        {slot}
      </div>
    );
  }

  private setName = (evt: any) => {
    const name: string = evt.target.value;
    this.props.updateSlot({ ...this.props.bot, name });
  }

  private toggleConnected = () => {
    this.props.toggleConnected(this.props.bot);
  }

  private makeExternal = () => {
    // const newSlot: M.InternalBotSlot = this.props.bot as M.InternalBotSlot;
    // newSlot.type = 'external';
    const newSlot: M.InternalBotSlot = this.props.bot as M.InternalBotSlot;
    this.props.updateSlot({...newSlot, type: 'external'} as M.ExternalBotSlot);
  }

  private makeInternal = () => {
    // newSlot.type = 'internal';
    const newSlot: M.ExternalBotSlot = this.props.bot as M.ExternalBotSlot;
    this.props.updateSlot({...newSlot, type: 'internal', botId: ""} as M.InternalBotSlot);
  }
}

export interface InternalSlotProps {
  slot: M.InternalBotSlot;
  allBots: M.BotList;
  setSlot: (slot: M.InternalBotSlot) => void;
  makeExternal: () => void;
  joinMatch: (slot: M.InternalBotSlot) => void;
}

export class InternalSlot extends React.Component<InternalSlotProps> {

  constructor(props: InternalSlotProps) {
    super(props);
  }

  public render() {
    const { slot, allBots } = this.props;
    return (
      <div>
        <BotSelector bots={allBots} value={slot.botId} onChange={this.setBot}/>
        <button onClick={this.joinLocal} disabled={this.props.slot.connected}>Join</button>
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
    this.props.joinMatch(slot);
  }

  private setBot = (botId: M.BotId) => {
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
        <div>token: {this.props.slot.token}</div>
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

export const FaIcon: React.SFC<{ icon: string, className?: string }> = ({ icon, className }) =>
  <i className={classnames('fa', 'fa-' + icon, className)} aria-hidden={true} />;
