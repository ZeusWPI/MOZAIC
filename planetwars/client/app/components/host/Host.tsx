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
          <BotSlots bots={this.props.selectedBots}/>
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

interface BotSlotsProps {
  bots: BotSlot[];
}

export const BotSlots: React.SFC<BotSlotsProps> = (props: BotSlotsProps) => {
  const bots = props.bots.map((bot, key) => <Slot key={key} bot={bot} />);
  return <ul> {bots} </ul>;
};

export const Slot: React.SFC<{bot: BotSlot}> = (props) => {
  return (
    <li>
      name: {props.bot.name}
      uuid: {props.bot.id}
      key: {props.bot.token}
    </li>);
};
