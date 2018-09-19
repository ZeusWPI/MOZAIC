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
  connectLocalBot(slot: Slot): void;
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
  connectLocalBot(slot: Slot): void;
  removeBot(botNum: number): void;
}
export class SlotElement extends React.Component<SlotElementProps> {

  public render() {
    const { slot, index } = this.props;

    const token = slot.client ? slot.client.token : null;
    const name = slot.player ? slot.player.name : `Player ${index + 1}`;

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
    if (this.props.slot.client) {
      clipboard.writeText(JSON.stringify(this.props.slot.client.token));
    }
  }

  private copyFull = (): void => {
    const { slot, address: { host, port }} = this.props;
    if (slot.player && slot.client) {
      const name = slot.player.name;
      const { token, clientId } = slot.client;
      const data = { token, name, port, host, clientId };
      clipboard.writeText(JSON.stringify(data));
    }
  }

  private statusToClass(slot: Slot): string {
    if (!slot.player || !slot.client) {
      return styles.unbound;
    }

    if (slot.client.connected) {
      return styles.connected;
    }

    return styles.filled;
  }

  private statusToFriendly(slot: Slot): string {
    if (!slot.player) {
      return 'Unassigned';
    }

    if (!slot.client) {
      return 'Unregistered';
    }

    if (!slot.client.connected) {
      return 'Not connected';
    }

    if (!slot.bot) {
      return 'Connected external bot';
    }

    return 'Connected internal bot';
  }

  private getActions(): JSX.Element[] {
    const { slot, index } = this.props;

    const kickBot = () => { this.props.removeBot(index); };

    const clss = (color: string) => `button is-outlined ${color}`;

    const connectLocal = () => this.props.connectLocalBot(slot);

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
        disabled={!slot.client}
      >
        Connect
      </button>
    );

    if (!slot.player) {
      return [];
    }

    if (!slot.client || slot.client.connected) {
      return [kick];
    }

    if (slot.bot) {
      return [kick, conn];
    }

    return [copy, copyFull];
  }
}
