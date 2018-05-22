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
  localBotIndex: number;
};

export type ConnectedInternalSlot = SlotProps & {
  status: 'connectedInternal';
  bot: M.Bot;
  clientId: number;
  localBotIndex: number;
};

export type ExternalSlot = SlotProps & {
  status: 'external';
};

export class SlotManager {

  public maps: M.MapList;
  private slots: Slot[] = [];

  constructor() { this.slots = this.genSlots(2); }

  public update(localBots: M.Bot[], config?: WeakConfig): Slot[] {
    if (!config) { return this.slots; }
    if (!config.selectedMap) { return this.slots; }

    const map = this.maps[config.selectedMap];

    const biggest = Math.max(map.slots, localBots.length);
    if (this.slots.length < biggest) {
      const newSlots = this.genSlots(biggest - this.slots.length);
      // TODO: Don't just concat, cut off unbounded slots < bigger
      this.slots = this.slots.concat(newSlots);
    }

    localBots.forEach((bot, localBotIndex) => {
      const { token } = this.slots[localBotIndex] as UnboundSlot | BoundInternalSlot;
      const { name, uuid } = bot;
      const status = 'boundInternal' as 'boundInternal';
      const newSlot = { status, token, name, bot, localBotIndex };
      this.slots[localBotIndex] = newSlot;
    });
    return this.slots;
  }

  public updateRunning(localBots: M.Bot[], config: StrongConfig): Slot[] {
    return this.slots;
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
    }));
  }
}
