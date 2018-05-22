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
  botId: M.BotId;
  localBotIndex: number;
};

export type ConnectedInternalSlot = SlotProps & {
  status: 'connectedInternal';
  botId: M.BotId;
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
      this.slots = this.slots.concat(newSlots);
    }

    localBots.forEach((bot, localBotIndex) => {
      const { token } = this.slots[localBotIndex] as UnboundSlot | BoundInternalSlot;
      const { name, uuid: botId } = bot;
      const status = 'boundInternal' as 'boundInternal';
      const newSlot = { status, token, name, botId, localBotIndex };
      this.slots[localBotIndex] = newSlot;
    });
    return this.slots;
  }

  public updateRunning(localBots: M.Bot[], config: StrongConfig): Slot[] {
    return this.slots;
  }

  public reset() {
    this.slots = this.genSlots(2);
  }

  private genSlots(amount: number): Slot[] {
    return Array(amount).fill(1).map((_, index) => ({
      status: 'unbound' as 'unbound',
      token: generateToken(),
      name: new Chance().name({ prefix: true, nationality: 'it' }),
    }));
  }
}
