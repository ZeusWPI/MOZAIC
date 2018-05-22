import * as React from 'react';
import { clipboard } from 'electron';

import * as M from '../../../database/models';
import { Slot, SlotStatus } from './SlotManager';

// tslint:disable-next-line:no-var-requires
const styles = require('./Lobby.scss');

export interface SlotListProps {
  slots: Slot[];
  port?: number;
  host?: string;
  connectLocalBot(id: M.BotId): void;
  removeBot(token: M.Token): void;
}
export class SlotList extends React.Component<SlotListProps> {
  public render() {
    const { slots } = this.props;
    const slotItems = slots.map((slot, index) => (
      <li key={index} className={styles.slotElementWrapper}>
        <SlotElement slot={slot} index={index} {...this.props} />
      </li>),
    );
    return (<ul className={styles.lobbySlots}>{slotItems}</ul>);
  }
}

export interface SlotElementProps {
  slot: Slot;
  index: number;
  host?: string;
  port?: number;
  connectLocalBot(id: M.BotId): void;
  removeBot(token: M.Token): void;
}
export class SlotElement extends React.Component<SlotElementProps> {

  public render() {
    const { slot: { token, status, name }, index } = this.props;
    const kickBot = () => this.props.removeBot(token);
    const clss = (color: string) => `button is-outlined ${color}`;
    const connectLocal = () => this.props.connectLocalBot(token);

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
      <button key='conn' className={clss('is-success')}>
        Connect
      </button>
    );

    const tools = {
      unbound: [copy, copyFull],
      boundInternal: [kick, conn],
      connectedInternal: [kick],
      external: [kick],
    };

    return (
      <div className={`${styles.slotElement} ${this.statusToClass(status)}`}>
        <h1>Player {index + 1}</h1>
        <p>{token}</p>
        <p>Status: {this.statusToFriendly(status)}</p>
        <p>Name: {name}</p>
        <div>
          {tools[status]}
        </div>
      </div >);
  }

  private copyToken = (): void => {
    clipboard.writeText(JSON.stringify(this.props.slot.token));
  }

  private copyFull = (): void => {
    const { slot: { token, status, name }, index, port, host } = this.props;
    const data = { token, name, port, host };
    clipboard.writeText(JSON.stringify(data));
  }

  private statusToClass(status: SlotStatus): string {
    switch (status) {
      case 'unbound': return styles.unbound;
      case 'boundInternal': return styles.filled;
      case 'connectedInternal': return styles.connected;
      case 'external': return styles.connected;
      default: return styles.typo;
    }
  }

  private statusToFriendly(status: SlotStatus): string {
    switch (status) {
      case 'unbound': return 'Unassigned';
      case 'boundInternal': return 'Ready Local Bot';
      case 'connectedInternal': return 'Connected Local Bot';
      case 'external': return 'External Bot';
    }
  }
}
