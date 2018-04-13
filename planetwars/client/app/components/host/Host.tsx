import * as React from "react";

import { Link, NavLink } from "react-router-dom";
import { BotConfig, IBotList, IBotData, BotID, BotSlot, Token, BotSlotList } from '../../utils/ConfigModels';
import { IMapList } from "../../utils/GameModels";

interface MatchParams { } // Don't know the parameters yet...

export interface HostStateProps {
  bots: IBotList;
  maps: IMapList;
  selectedBots: BotSlotList;
}

export interface HostDispatchProps {
  selectBotInternal: (name: string, id: BotID) => void;
  selectBotExternal: (name: string) => void;
  unselectBot: (uuid: string, all: boolean) => void;
  runMatch: (params: MatchParams) => void;
  changeLocalBot: (token: Token, id: BotID) => void;
}

export interface HostState { }

export type HostProps = HostStateProps & HostDispatchProps;

export class Host extends React.Component<HostProps, HostState> {
  public render() {
    const toggle = (evt: any) => this.setState({ mapToggled: true });
    return (
      <div>
        <div>
          <button onClick={() => this.addInternal()}>+ Add one of your own bots</button>
          <button onClick={() => this.addExternal()}>+ Add an external bot</button>
        </div>
        <div>
          <BotSlots
            selectedBots={this.props.selectedBots}
            allBots={this.props.bots}
            changeLocalBot={this.props.changeLocalBot}
          />
        </div>
      </div>
    );
  }

  public addInternal() {
    this.props.selectBotInternal("My Bot", "");
  }

  public addExternal() {
    this.props.selectBotExternal("My Enemy's Bot");
  }
}

interface BotSlotsProps {
  selectedBots: BotSlotList;
  allBots: IBotList;
  changeLocalBot: (token: Token, id: BotID) => void;
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
  changeLocalBot: (token: Token, id: BotID) => void;
}

export const Slot: React.SFC<SlotProps> = (props) => {
  let extra;
  if (props.bot.id !== undefined) {
    const options = Object.keys(props.allBots).map((uuid, i) => {
      return <option value={uuid} key={i}> {props.allBots[uuid].config.name} </option>;
    });
    extra = (
      <div>
        <select value={props.bot.id} onChange={(evt) => { props.changeLocalBot(props.token, evt.target.value) }}>
          {options}
        </select>
        (token: {props.token})
      </div>
    );
  } else {
    extra = <div>token: {props.token}</div>;
  }
  return (
    <li>
      Name: <input type="text" defaultValue={props.bot.name}/> {extra}
    </li>);
};
