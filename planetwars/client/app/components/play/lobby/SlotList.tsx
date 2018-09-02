import * as React from 'react';
import { clipboard } from 'electron';

import * as M from '../../../database/models';
import { Slot } from './SlotManager';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export interface SlotListProps {
  slots: Slot[];
  port?: number;
  host?: string;
  isServerRunning: boolean;
  willBeKicked(idx: number): boolean;
  connectLocalBot(slot: Slot, playerNum: number): void;
  removeBot(botNum: number): void;
}

export class SlotList extends React.Component<SlotListProps> {
  public render() {
    const { slots } = this.props;
    const slotItems = slots.map((slot, index) => (
      <li key={index} className={styles.slotElementWrapper}>
        <SlotElement
          slot={slot}
          index={index}
          host={this.props.host}
          port={this.props.port}
          willBeKicked={this.props.willBeKicked(index)}
          connectLocalBot={this.props.connectLocalBot}
          removeBot={this.props.removeBot}
          isServerRunning={this.props.isServerRunning}
        />
      </li>),
    );
    return (<ul className={styles.lobbySlots}>{slotItems}</ul>);
  }
}

export interface SlotElementProps {
  slot: Slot;
  index: number;
  willBeKicked: boolean;
  host?: string;
  port?: number;
  isServerRunning: boolean;
  connectLocalBot(slot: Slot, playerNum: number): void;
  removeBot(botNum: number): void;
}
export class SlotElement extends React.Component<SlotElementProps> {

  public render() {
    const { slot, index } = this.props;
    const { token, name, clientId } = slot;

    console.log(slot);

    const kicked = (this.props.willBeKicked) ? (styles.kicked) : '';
    return (
      <div className={`${styles.slotElement} ${this.statusToClass(slot)} ${kicked}`}>
        <h1>Player {index + 1}</h1>
        <p>{token}</p>
        <p>Status: {this.statusToFriendly(slot)}</p>
        <p>Name: {name}</p>
        <p>Client ID: {clientId}</p>
        <div>
          {this.getActions()}
        </div>
      </div >);
  }

  private copyToken = (): void => {
    clipboard.writeText(JSON.stringify(this.props.slot.token));
  }

  private copyFull = (): void => {
    const { slot: { token, name, clientId }, index, port, host } = this.props;
    const data = { token, name, port, host, clientId };
    clipboard.writeText(JSON.stringify(data));
  }

  private statusToClass(slot: Slot): string {
    if (slot.bot && slot.connected) {
      return styles.connectedInternal;
    }
    if (slot.bot) {
      return styles.filled;
    }
    if (slot.connected) {
      return styles.connected;
    }
    return styles.unbound;
  }

  private statusToFriendly(slot: Slot): string {
    if (slot.bot && slot.connected) {
      return 'Connected Local Bot';
    }
    if (slot.bot) {
      return 'Local Bot';
    }
    if (slot.connected) {
      return 'Connected external bot';
    }
    if (slot.clientId) {
      return 'Not connected';
    }
    return 'Unassigned';
  }

  private getActions(): JSX.Element[] {
    const { slot, index } = this.props;
    const { token, name } = slot;

    const kickBot = () => { this.props.removeBot(index); };

    const clss = (color: string) => `button is-outlined ${color}`;

    const connectLocal = () => this.props.connectLocalBot(slot, index);


    const kick = (
      <button key='kick' className={clss('is-danger')} onClick={kickBot}>
        Kick player
      </button>
    );

    const copy = (
      <button key='copy' className={clss('is-light')} onClick={this.copyToken}>
        Copy
      </button>
    );

    const copyFull = (
      <button key='copyFull' className={clss('is-light')} onClick={this.copyFull}>
        Copy Full
      </button>
    );

    const conn = (
      <button
        key='conn'
        className={clss('is-success')}
        onClick={connectLocal}
        disabled={!this.props.isServerRunning}
      >
        Connect
      </button>
    );

    if (slot.bot && slot.connected) {
      return [kick];
    }
    if (slot.bot) {
      return [kick, conn];
    }
    if (slot.connected) {
      return [kick];
    }
    if (slot.clientId) {
      return [copy, copyFull]
    }
    return [];
  }
}
