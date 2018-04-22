import * as React from "react";

import {
  BotConfig,
  BotList,
  BotData,
  BotId,
  BotSlot,
  Token,
  BotSlotList,
  MatchConfig,
  MapList,
} from '../../utils/database/models';
import { MatchParams } from "../../actions/actions";

// tslint:disable-next-line:no-var-requires
const styles = require("./Host.scss");

export interface HostStateProps {
  bots: BotList;
  maps: MapList;
  selectedBots: BotSlotList;
  selectedMap: string;
}

export interface HostDispatchProps {
  selectBotInternal: (name: string, id: BotId) => void;
  selectBotExternal: (name: string) => void;
  unselectBot: (uuid: string, all: boolean) => void;
  runMatch: (params: MatchParams) => void;
  changeLocalBot: (token: Token, slot: BotSlot) => void;
  selectMap: (id: string) => void;
}

export interface HostState { }

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
            selectedBots={this.props.selectedBots}
            allBots={this.props.bots}
            changeLocalBot={this.props.changeLocalBot}
          />
        </div>
        <div id={styles.mapSelector}>
          <h2 className="title is-5">
            <span className="tag is-info is-small is-rounded">3</span>
            <span className={styles.tagInfoText}> Pick a Map</span>
          </h2>

          <MapSelector
            maps={this.props.maps}
            selectMap={this.props.selectMap}
            selectedMap={this.props.selectedMap}
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
    const config: MatchParams = {
      bots: this.props.selectedBots,
      map: this.props.selectedMap,
      maxTurns: 500,
    };
    console.log(config);
    this.props.runMatch(config);
  }

  private addInternal = () => {
    this.props.selectBotInternal("My Bot", "");
  }

  private addExternal = () => {
    this.props.selectBotExternal("My Enemy's Bot");
  }
}

interface BotSlotsProps {
  selectedBots: BotSlotList;
  allBots: BotList;
  changeLocalBot: (token: Token, slot: BotSlot) => void;
}

export const BotSlots: React.SFC<BotSlotsProps> = (props) => {
  const slots = Object.keys(props.selectedBots).map((token, idx) => {
    return (
      <Slot
        key={idx}
        bot={props.selectedBots[token]}
        allBots={props.allBots}
        token={token}
        changeLocalBot={props.changeLocalBot}
      />
    );
  });
  return <ul>{slots}</ul>;
};

interface SlotProps {
  bot: BotSlot;
  allBots: BotList;
  token: Token;
  changeLocalBot: (token: Token, slot: BotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    let extra;
    if (this.props.bot.id !== undefined) {
      const options = Object.keys(this.props.allBots).map((uuid, i) => {
        return (
          <option value={uuid} key={i}>
            {" "}
            {this.props.allBots[uuid].config.name}{" "}
          </option>
        );
      });
      extra = (
        <div>
          <select value={this.props.bot.id} onChange={this.changeBotID}>
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
    const id: BotId = evt.target.value;
    const newBot = this.props.bot;
    newBot.id = id;
    this.props.changeLocalBot(this.props.token, newBot);
  }

  private changeBotName(evt: any) {
    const name: string = evt.target.value;
    const newBot = this.props.bot;
    newBot.name = name;
    this.props.changeLocalBot(this.props.token, newBot);
  }
}

interface MapSelectorProps {
  maps: MapList;
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
