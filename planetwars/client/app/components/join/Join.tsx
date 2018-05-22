import * as React from "react";
import * as M from '../../database/models';
import AddressForm from '../host/AddressForm';
import { BotSelector } from "../host/BotSelector";
import Section from '../play/Section';
import { HorizontalInput } from "../play/Config";

// tslint:disable-next-line:no-var-requires
const styles = require("./Join.scss");

export interface JoinStateProps {
  allBots: M.BotList;
}

export interface JoinDispatchProps {
  joinMatch: (address: M.Address, bot: M.InternalBotSlot) => void;
}

export type JoinProps = JoinStateProps & JoinDispatchProps;

export interface JoinState {
  address: M.Address;
  botId?: M.BotId;
  token: string;
}

export class Join extends React.Component<JoinProps, JoinState> {
  constructor(props: JoinProps) {
    super(props);
    this.state = {
      address: {
        host: '127.0.0.1',
        port: 9142,
      },
      token: '',
    };
    this.setAddress = this.setAddress.bind(this);
    this.setToken = this.setToken.bind(this);
    this.setBotId = this.setBotId.bind(this);
    this.joinGame = this.joinGame.bind(this);
  }

  public render() {
    const { address, token } = this.state;

    return (
      <Section header={"Join Game"}>
        <div>
          <AddressForm address={address} onChange={this.setAddress} />

          <HorizontalInput id="token" label="Token">
            <input type="text" onChange={this.setToken} />
          </HorizontalInput>

          <BotSelector
            bots={this.props.allBots}
            value={this.state.botId}
            onChange={this.setBotId}
          />
          <div className="control">
            <button
              className="button is-primary"
              type="button"
              onClick={this.joinGame}
              disabled={!this.isValid()}
            >
            Join
            </button>
          </div>
        </div>
      </Section>
    );
  }

  private isValid() {
    return this.state.botId && this.state.token;
  }

  private setAddress(address: M.Address) {
    this.setState({
      address,
    });
  }

  private setToken(evt: React.FormEvent<HTMLInputElement>) {
    this.setState({
      token: evt.currentTarget.value,
    });
  }

  private setBotId(botId: M.BotId) {
    this.setState({ botId });
  }

  private joinGame() {
    const bot: M.InternalBotSlot = {
      type: M.BotSlotType.internal,
      token: this.state.token,
      botId: this.state.botId!,
      name: this.props.allBots[this.state.botId!].name,
      connected: true,
    };
    this.props.joinMatch(this.state.address, bot);
  }
}
