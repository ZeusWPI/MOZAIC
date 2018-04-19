import * as React from "react";

import { BotConfig, IBotList, IBotData, BotID, BotSlot, Token, BotSlotList,
  MatchConfig } from '../../utils/ConfigModels';
import { IMapList } from "../../utils/GameModels";
import { MatchParams } from '../../actions/actions';

export interface HostStateProps {
  bots: IBotList;
  maps: IMapList;
  selectedBots: BotSlotList;
  selectedMap: string;
}

export interface HostDispatchProps {
  selectBotInternal: (name: string, id: BotID) => void;
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
      <div>
        <div>
          <button onClick={this.addInternal}>+ Add one of your own bots</button>
          <button onClick={this.addExternal}>+ Add an external bot</button>
        </div>
        <div>
          <BotSlots
            selectedBots={this.props.selectedBots}
            allBots={this.props.bots}
            changeLocalBot={this.props.changeLocalBot}
          />
        </div>
        <MapSelector maps={this.props.maps} selectMap={this.props.selectMap} selectedMap={this.props.selectedMap}/>
        <button onClick={this.startServer}>Play!</button>
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
  allBots: IBotList;
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
  return (
    <ul>
      {slots}
    </ul>
  );
};

interface SlotProps {
  bot: BotSlot;
  allBots: IBotList;
  token: Token;
  changeLocalBot: (token: Token, slot: BotSlot) => void;
}

export class Slot extends React.Component<SlotProps> {
  public render() {
    let extra;
    if (this.props.bot.id !== undefined) {
      const options = Object.keys(this.props.allBots).map((uuid, i) => {
        return <option value={uuid} key={i}> {this.props.allBots[uuid].config.name} </option>;
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
        Name: <input
          type="text"
          defaultValue={this.props.bot.name}
          onBlur={this.changeBotName}
        />
        {extra}
      </li>);
  }

  private changeBotID = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const id: BotID = evt.target.value;
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
  maps: IMapList;
  selectMap: (id: string) => void;
  selectedMap: string;
}

export const MapSelector: React.SFC<MapSelectorProps> = (props) => {
  const mapElements = Object.keys(props.maps).map(
    (key, idx) => <option value={key} key={idx}>{props.maps[key].name}</option>,
  );
  const handleChange = (evt: any) => props.selectMap(evt.target.value);
  mapElements.unshift(<option value="">Select Map</option>);
  return (
    <select value={props.selectedMap} onChange={handleChange}>
      {mapElements}
    </select>
  );
};
