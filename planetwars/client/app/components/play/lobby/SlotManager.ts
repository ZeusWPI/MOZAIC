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
  willBeKicked: boolean;
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

  public maps: M.MapList;
  private slots: Slot[] = [];

  constructor() { this.slots = this.genSlots(2); }

  public update(config?: WeakConfig): Slot[] {
    if (!config) { return this.slots; }
    if (!config.selectedMap) { return this.slots; }

    const map = this.maps[config.selectedMap];

    if (this.slots.length < map.slots) {
      const newSlots = this.genSlots(map.slots - this.slots.length);
      return this.slots.concat(newSlots);
    } else {
      return this.slots;
    }
  }

  public updateRunning(config: StrongConfig): Slot[] {
    const map = this.maps[config.map];
    if (this.slots.length < map.slots) {
      const newSlots = this.genSlots(map.slots - this.slots.length);
      return this.slots.concat(newSlots);
    } else {
      this.slots.forEach((slot, i) => {

      });
    }
    return this.slots;
  }

  public bindLocalBot(bot: M.Bot): Slot[] {

    const updateSlot = (slot: Slot, i: number) => {
      const { name, uuid } = bot;
      const { token } = slot;
      const status = 'boundInternal' as 'boundInternal';
      const willBeKicked = (i >= this.slots.length);
      this.slots[i] = { status, name, bot, token, willBeKicked };
      return [...this.slots];
    };

    for (let index = 0; index < this.slots.length; index++) {
      const slot = this.slots[index];
      if (slot.status === 'unbound') {
        return updateSlot(slot, index);
      }
    }

    this.slots.push(this.genSlots(1)[0]);
    const lastIndex = this.slots.length - 1;
    return updateSlot(this.slots[lastIndex], lastIndex);
  }

  public connectLocal(playerNum: number, clientId: number): Slot[] {
    const slot = this.slots[playerNum];
    if (!this.verifyBoundInternal(slot)) { return this.slots; }

    this.slots[playerNum] = { ...slot, clientId, status: 'connectedInternal' };
    return [...this.slots];
  }

  public removeBot(playerNum: number): Slot[] {
    const slot = this.slots[playerNum];
    this.slots[playerNum] = this.genSlots(1)[0];
    return [...this.slots];
  }

  public disconnectLocal(playerNum: number): Slot[] {
    const slot = this.slots[playerNum];
    if (!this.verifyConnectedInternal(slot)) { return this.slots; }

    this.slots[playerNum] = { ...slot, status: 'boundInternal' };
    return [...this.slots];
  }

  public reset() {
    this.slots = this.genSlots(2);
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

  private genSlots(amount: number): Slot[] {
    return Array(amount).fill(1).map((_, index) => ({
      status: 'unbound' as 'unbound',
      token: generateToken(),
      name: new Chance().name({ prefix: true, nationality: 'it' }),
      willBeKicked: false,
    }));
  }
}
