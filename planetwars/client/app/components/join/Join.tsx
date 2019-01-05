import * as React from "react";
import * as M from '../../database/models';
import AddressForm from '../host/AddressForm';
import { BotSelector } from "../host/BotSelector";
import Section from '../play/Section';
import { HorizontalInput } from "../play/Config";
import { clipboard } from 'electron';

import * as styles from "./Join.scss";

export interface JoinStateProps {
  allBots: M.BotList;
}

export interface JoinDispatchProps {
  joinMatch: (address: M.Address, bot: M.InternalBotSlot) => void;
}

export type JoinProps = JoinStateProps & JoinDispatchProps;

export interface ImportCopy {
  token: string;
  name: string;
  host: string;
  port: number;
}

export interface JoinState {
  address: M.Address;
  botId?: M.BotId;
  token: string;
  lastClipboard: string;
  import?: ImportCopy;
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
      lastClipboard: '',
    };
    this.setAddress = this.setAddress.bind(this);
    this.setToken = this.setToken.bind(this);
    this.setBotId = this.setBotId.bind(this);
    this.joinGame = this.joinGame.bind(this);
  }

  public render() {
    const { address, token } = this.state;

    return (
      <Section header={"Join Game"} onMouseMove={this.checkClipboard}>
        <div>
          <AddressForm address={address} onChange={this.setAddress} />

          <HorizontalInput id="token" label="Token">
            <input type="text" onChange={this.setToken} value={this.state.token} />
          </HorizontalInput>

          <BotSelector
            bots={this.props.allBots}
            value={this.state.botId}
            onChange={this.setBotId}
          />
          <div className="field is-grouped">
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
            {this.state.import ? (
              <div className="control">
                <a className={"button is-link"} onClick={this.importConfig}>
                  Import "{this.state.import.name}" from clipboard
                  </a>
              </div>) :
              undefined
            }
          </div>
        </div>
      </Section>
    );
  }

  private importConfig = () => {
    if (!this.state.import) { return; }
    const { host, port, name, token } = this.state.import;
    this.setState({ address: { host, port }, token });
  }

  private checkClipboard = () => {
    const clipBoardtext = clipboard.readText();
    if (this.state.lastClipboard !== clipBoardtext) {
      try {
        const { host, port, name, token } = JSON.parse(clipBoardtext);
        if (host && port && name && token) {
          this.setState({ import: { host, port, name, token } });
        } else {
          this.setState({ import: undefined });
        }
      } catch (e) {
        // JSON.parse error probably...
        this.setState({ import: undefined });
      }
      this.setState({ lastClipboard: clipBoardtext });
    }
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
