import { Chance } from 'chance';

import * as M from '../../../database/models';
import { generateToken } from '../../../utils/GameRunner';
import { WeakConfig, StrongConfig } from '../types';
import { MatchRunner } from 'mozaic-client';

export interface Slot {
  name: string;
  token: M.Token;
  connected: boolean;
  clientId?: number;
  bot?: M.Bot;
}

export type Slots = { [token: string]: Slot };
export type Clients = { [clientId: number]: Slot};

export class SlotManager {
  public matchRunner?: MatchRunner;
  public connectedClients: Set<number> = new Set();
  public slots: Slots;
  public slotList: string[];
  public clients: Clients;

  private onSlotChange: (self: SlotManager) => void;

  constructor(callback: (self: SlotManager) => void) {
    this.slotList = [];
    this.slots = {};
    this.clients = {};
    this.onSlotChange = callback;
  }

  public update(map: M.MapMeta) {
    while (this.slotList.length < map.slots) {
      const slot = this.createSlot();
      this.slotList.push(slot.token);
    }

    while (this.slotList.length > map.slots) {
      const token = this.slotList.pop()!;
      const slot = this.slots[token];
      this.unregisterSlot(slot);
    }
    this.notifyListeners();
  }

  public bindLocalBot(bot: M.Bot) {
    // find first unused slot
    let i = 0;
    while (i < this.slotList.length
      && (this.slots[this.slotList[i]].bot
          || this.slots[this.slotList[i]].connected)
    ) {
      i += 1;
    }
    // dont add more bots than slots
    if (i === this.slotList.length) { return; }

    const slot = this.slots[this.slotList[i]];
    slot.bot = bot;
    slot.name = bot.name;
    this.notifyListeners();
  }

  public connectClient(clientId: number) {
    this.connectedClients.add(clientId);
    this.clients[clientId].connected = true;
    this.notifyListeners();
  }

  public disconnectClient(clientId: number) {
    this.connectedClients.delete(clientId);
    this.clients[clientId].connected = false;
    this.notifyListeners();
  }

  public removeBot(playerNum: number) {
    const oldSlot = this.slots[this.slotList[playerNum]];
    this.unregisterSlot(oldSlot);
    const newSlot = this.createSlot();
    this.slotList[playerNum] = newSlot.token;
    this.notifyListeners();
  }

  public setMatchRunner(matchRunner: MatchRunner) {
    this.matchRunner = matchRunner;

    matchRunner.onPlayerConnected.subscribe((clientId) => {
      this.connectClient(clientId);
    });

    matchRunner.onPlayerDisconnected.subscribe((clientId) => {
      this.disconnectClient(clientId);
    });

    this.slotList.forEach((token) => {
      const slot = this.slots[token];
      this.registerSlot(slot);
      this.notifyListeners();
    });
  }

  public getSlots(): Slot[] {
    return this.slotList.map((token) => this.slots[token]);
  }

  private notifyListeners() {
    this.onSlotChange(this);
  }

  private registerSlot(slot: Slot) {
    if (this.matchRunner) {
      const token = Buffer.from(slot.token, 'hex');
      this.matchRunner.matchControl.addPlayer(token).then((clientId) => {
        slot.clientId = clientId;
        this.clients[clientId] = slot;
        this.notifyListeners();
      });
    }
  }

  private unregisterSlot(slot: Slot) {
    if (this.matchRunner && slot.clientId) {
      const clientId = slot.clientId;
      this.matchRunner.matchControl.removePlayer(slot.clientId).then(() => {
        delete this.clients[clientId];
        delete this.slots[slot.token];
        this.notifyListeners();
      });
    }
  }

  private createSlot(): Slot {
    const slot = {
      name: new Chance().name({ prefix: true, nationality: 'it' }),
      token: generateToken(),
      connected: false,
    };
    this.slots[slot.token] = slot;
    this.registerSlot(slot);
    return slot;
  }
}
