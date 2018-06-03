import * as React from 'react';
import { clipboard } from 'electron';

import * as M from '../../../database/models';
import { Slot } from '../types';
import { PwConfig, Address } from '../../../reducers/lobby';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export interface SlotListProps {
  slots: Slot[];
  address: Address;
  isServerRunning: boolean;
  connectLocalBot(slot: Slot, playerNum: number): void;
  removeBot(botNum: number): void;
}

export class SlotList extends React.Component<SlotListProps> {
  public render() {
    const { slots, address } = this.props;
    const slotItems = slots.map((slot, index) => (
      <li key={index} className={styles.slotElementWrapper}>
        <SlotElement
          slot={slot}
          index={index}
          address={address}
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
  address: Address;
  isServerRunning: boolean;
  connectLocalBot(slot: Slot, playerNum: number): void;
  removeBot(botNum: number): void;
}
export class SlotElement extends React.Component<SlotElementProps> {

  public render() {
    const { slot, index } = this.props;

    let token = null;
    let name = `Player ${index + 1}`;

    if (slot.player) {
      // token = slot.player.token;
      name = slot.player.name;
    }

    // TODO
    const kicked = (false) ? (styles.kicked) : '';
    return (
      <div className={`${styles.slotElement} ${this.statusToClass(slot)} ${kicked}`}>
        <h1>{name}</h1>
        <p>{token}</p>
        <p>Status: {this.statusToFriendly(slot)}</p>
        <div>
          {this.getActions()}
        </div>
      </div >);
  }

  private copyToken = (): void => {
    if (this.props.slot.player) {
      //clipboard.writeText(JSON.stringify(this.props.slot.player.token));
    }
  }

  private copyFull = (): void => {
    const { slot, address: { host, port }} = this.props;
    if (slot.player) {
      const name = slot.player.name;
      const token = null; // TODO
      const data = { token, name, port, host };
      clipboard.writeText(JSON.stringify(data));
    }
  }

  private statusToClass(slot: Slot): string {
    const connected = false; // TODO

    if (slot.bot && connected) {
      return styles.connectedInternal;
    }
    if (slot.bot) {
      return styles.filled;
    }
    if (connected) {
      return styles.connected;
    }
    return styles.unbound;
  }

  private statusToFriendly(slot: Slot): string {
    const connected = false; // TODO

    if (slot.bot && connected) {
      return 'Connected Local Bot';
    }
    if (slot.bot) {
      return 'Local Bot';
    }
    if (connected) {
      return 'Connected external bot';
    }
    if (slot.player) {
      return 'Not connected';
    }
    return 'Unassigned';
  }

  private getActions(): JSX.Element[] {
    const { slot, index } = this.props;

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

    const connected = false; // TODO

    if (slot.bot && connected) {
      return [kick];
    }
    if (slot.bot) {
      return [kick, conn];
    }
    if (connected) {
      return [kick];
    }
    if (slot.player) {
      return [copy, copyFull];
    }
    return [];
  }
}
