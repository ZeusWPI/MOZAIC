import { Chance } from 'chance';

import * as M from '../../../database/models';
import { generateToken } from '../../../utils/GameRunner';
import { WeakConfig, StrongConfig } from '../types';

export type Slot = UnboundSlot | BoundInternalSlot | ConnectedInternalSlot | ExternalSlot;
export type SlotStatus = 'unbound' | 'boundInternal' | 'connectedInternal' | 'external';

export interface SlotProps {
  status: SlotStatus;
  token: M.Token;
  name: string;
}

export type UnboundSlot = SlotProps & {
  status: 'unbound';
};

export type BoundInternalSlot = SlotProps & {
  status: 'boundInternal';
  bot: M.Bot;
};

export type ConnectedInternalSlot = SlotProps & {
  status: 'connectedInternal';
  bot: M.Bot;
  clientId: number;
};

export type ExternalSlot = SlotProps & {
  clientId: number;
  status: 'external';
};

export class SlotManager {
  public connectedClients: Set<number> = new Set();
  public slots: Slot[] = [];

  public update(map: M.MapMeta) {
    while (this.slots.length < map.slots) {
      this.slots.push(this.createSlot());
    }
  }

  public bindLocalBot(bot: M.Bot) {
    // find first unbound slot
    let i = 0;
    while (i < this.slots.length && this.slots[i].status !== 'unbound') {
      i += 1;
    }
    // create a new unbound slot when none was found
    if (i === this.slots.length) {
      this.slots.push(this.createSlot());
    }

    this.slots[i] = {
      ...this.slots[i] as UnboundSlot,
      status: 'boundInternal' as 'boundInternal',
      bot,
    };
  }

  public connectClient(clientId: number) {
    this.connectedClients.add(clientId);
  }

  public disconnectClient(clientId: number) {
    this.connectedClients.delete(clientId);
  }

  public connectLocal(playerNum: number, clientId: number): Slot[] {
    const slot = this.slots[playerNum];
    if (!this.verifyBoundInternal(slot)) { return this.slots; }
    this.slots[playerNum] = { ...slot, clientId, status: 'connectedInternal' };
    return [...this.slots];
  }

  public removeBot(playerNum: number): Slot[] {
    const slot = this.slots[playerNum];
    this.slots[playerNum] = this.createSlot();
    return [...this.slots];
  }

  public disconnectLocal(playerNum: number): Slot[] {
    const slot = this.slots[playerNum];
    if (!this.verifyConnectedInternal(slot)) { return this.slots; }

    this.slots[playerNum] = { ...slot, status: 'boundInternal' };
    return [...this.slots];
  }

  private verifyBoundInternal(slot: Slot): slot is BoundInternalSlot {
    this.assert(slot, 'boundInternal');
    return true;
  }

  private verifyConnectedInternal(slot: Slot): slot is BoundInternalSlot {
    this.assert(slot, 'connectedInternal');
    return true;
  }

  private assert(slot: Slot, status: SlotStatus): void | never {
    if (slot.status !== status) {
      throw new Error('We can\'t program.');
    }
  }

  private createSlot(): Slot {
    return {
      status: 'unbound' as 'unbound',
      token: generateToken(),
      name: new Chance().name({ prefix: true, nationality: 'it' }),
    };
  }
}
