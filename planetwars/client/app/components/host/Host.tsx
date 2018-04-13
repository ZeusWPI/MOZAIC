import * as React from "react";

import { Link, NavLink } from "react-router-dom";
import { BotConfig, IBotList, IBotData, BotID, BotSlot, Token } from '../../utils/ConfigModels';
import { IMapList } from "../../utils/GameModels";

interface MatchParams { } // Don't know the parameters yet...

export interface HostStateProps {
  bots: IBotList;
  maps: IMapList;
  selectedBots: BotSlot[];
}

export interface HostDispatchProps {
  selectBotInternal: (name: string, id: BotID) => void;
  selectBotExternal: (name: string) => void;
  unselectBot: (uuid: string, all: boolean) => void;
  runMatch: (params: MatchParams) => void;
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
          <BotSlots selectedBots={this.props.selectedBots} allBots={this.props.bots}/>
        </div>
      </div>
    );
  }

  public addInternal() {
    this.props.selectBotInternal("internal", "abc");
  }

  public addExternal() {
    this.props.selectBotExternal("external");
  }
}

export const BotSlots: React.SFC<{ selectedBots: BotSlot[], allBots: IBotList }> = (props) => {
  const slots = props.selectedBots.map((bot, key) => {
    return <Slot key={key} bot={bot} allBots={props.allBots} />;
  });
  return (
    <ul>
      {slots}
    </ul>
  );
};

export const Slot: React.SFC<{bot: BotSlot, allBots: IBotList}> = (props) => {
  let extra;
  if (props.bot.id) {
    const options = Object.keys(props.allBots).map((uuid, key) => {
      return <option key={key}> {props.allBots[uuid].config.name} </option>;
    });
    extra = <div><select>{options}</select>(token: {props.bot.token})</div>;
  } else {
    extra = <div>token: {props.bot.token}</div>;
  }
  return (
    <li>
      Name: <input type="text" value={props.bot.name}/> {extra}
    </li>);
};
