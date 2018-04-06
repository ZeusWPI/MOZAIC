import { remote } from 'electron';
import * as path from 'path';
import * as low from 'lowdb';
import * as FileAsync from 'lowdb/adapters/FileAsync';
import log from 'electron-log';

import * as A from '../actions/actions';
import { IBotList, BotConfig, BotID } from './ConfigModels';
import { Match, IMatchList, IMapList } from './GameModels';
import { store as globalStore } from '../index';
import { IGState } from '../reducers';
import { Notification } from '../utils/UtilModels';
import { Config } from './Config';

export interface DbSchemaV3 {
  version: 'v3';
  matches: IMatchList;
  bots: IBotList;
  maps: IMapList;
  notifications: Notification[];
}

// Utility to allow accessing the DB somewhat more safe. You can these string
// properties as key so that you have some typechecking over typo's.
export const SCHEMA = {
  VERSION: 'version',
  MATCHES: 'matches',
  BOTS: 'bots',
  NOTIFICATIONS: 'notifications',
  MAPS: 'maps',
};

// ----------------------------------------------------------------------------
// Initialisation
// ----------------------------------------------------------------------------

const { app } = remote;
const dbPath = (Config.isDev)
  ? 'db.json'
  : path.join(app.getPath('userData'), 'db.json');
const adapter = new FileAsync(dbPath);
const database = low<DbSchemaV3, typeof adapter>(adapter);

/*
 * This function will populate the store initially with the DB info and
 * subscribe itself to changes so it can propage the relevant ones to the DB.
 */
export function bindToStore(store: any): Promise<void> {
  return database
    .then((db) => {
      console.log(db);
    })
    // .then((db) => db.defaults({
    //   version: 'v3',
    //   matches: {},
    //   bots: {},
    //   maps: {},
    //   notifications: [],
    // }).write().then(() => db))
    // .then((db) => {
    //   console.log(db);
    //   if (db.version !== 'v3') {
    //     return db.update(migrateOld(db));
    //   }
    //   return db;
    // })
    // .then((db) => {
    //   console.log(db.object);
    //   // TODO: these JSON objects should be validated to avoid weird runtime
    //   // errors elsewhere in the code
    //   Object.keys(db.bots).forEach((uuid) => {
    //     store.dispatch(A.importBotFromDB(db.bots[uuid]));
    //   });
    //   Object.keys(db.maps).forEach((uuid) => {
    //     store.dispatch(A.importMapFromDB(db.maps[uuid]));
    //   });
    //   Object.keys(db.matches).forEach((uuid) => {
    //     const matchData = db.matches[uuid];
    //     store.dispatch(A.importMatchFromDB({
    //       ...matchData,
    //       timestamp: new Date(matchData.timestamp),
    //     }));
    //   });
    //   db.notifications.forEach((notification: Notification) => {
    //     store.dispatch(A.importNotificationFromDB(notification));
    //   });
    // })
    // .then(initializeListeners)
    // .then(() => store.subscribe(changeListener))
    .catch((err) => {
      console.log(err);
      store.dispatch(A.dbError(err));
    });
}

// ----------------------------------------------------------------------------
// Redux store subscription
// ----------------------------------------------------------------------------

/*
 * This gets procced when the state changes and checks whether the specific
 * listeners need updating, and dispatches action when they require so.
 * TODO: Optimize for UUID dicts
 */
function changeListener() {
  const state: IGState = globalStore.getState();
  listeners.forEach((listener) => {
    const oldValue = listener.oldValue;
    const newValue = listener.select(state);
    if (oldValue !== newValue) {
      listener.write(newValue, globalStore.dispatch);
    }
  });
}

/*
 * Initialize the listeners with the objects just synced from the DB.
 * This way we prevent a guaranteed (and possibly confusing) SYNC_DB event
 * on the first, possible irrelevant, state change.
 */
function initializeListeners() {
  const state: IGState = globalStore.getState();
  listeners.forEach((l) => l.select(state));
}

type Selector<T> = (state: IGState) => T;
type Mutator<T> = (newValue: T) => void;

class TableListener<T> {
  public oldValue: T;

  constructor(private selector: Selector<T>, private accessor: string) { }

  public select(state: IGState): T {
    const val: T = this.selector(state);
    this.oldValue = val;
    return val;
  }

  public write(newValue: T, dispatch: any): Promise<void> {
    return database
      .then((db) => {
        db.update(this.accessor, (old) => newValue).write();
      })
      .catch((err) => dispatch(A.dbError(err)))
      .then(() => dispatch(A.dbSync(newValue)));
  }
}

const listeners: TableListener<any>[] = [
  new TableListener<IMatchList>(
    (state: IGState) => state.matches,
    SCHEMA.MATCHES,
  ),
  new TableListener<IBotList>(
    (state: IGState) => state.bots,
    SCHEMA.BOTS,
  ),
  new TableListener<IMapList>(
    (state: IGState) => state.maps,
    SCHEMA.MAPS,
  ),
  new TableListener<Notification[]>(
    (state: IGState) => state.notifications,
    SCHEMA.NOTIFICATIONS,
  ),
];

// ----------------------------------------------------------------------------
// Migrations
// ----------------------------------------------------------------------------

type DbSchema = DbSchemaV1 | DbSchemaV2 | DbSchemaV3;

function migrateOld(oldDb: DbSchema): DbSchemaV3 {
  let db = oldDb;
  while (db.version !== 'v3') {
    switch (db.version) {
      case 'v1':
        db = upgradeV1(db as DbSchemaV1);
        break;
      case 'v2':
        db = upgradeV2(db as DbSchemaV2);
        break;
      default:
        log.error(`[DB] Unknown database version. ${db}`);
        throw new Error(`[DB] Unknown database version. ${db}`);
    }
  }
  return db;
}

function upgradeV1(db: DbSchemaV1): DbSchemaV2 {
  log.warn('[DB] Somebody is messing with db-versions (v1 was never used)!');
  return {
    version: 'v2',
    matches: {},
    bots: {},
    maps: {},
    notifications: [],
  };
}

function upgradeV2(db: DbSchemaV2): DbSchemaV3 {
  const bots: BotListV2 = (db as DbSchemaV2).bots;
  const newBots: IBotList = {};

  const migrateConfig = (config: BotConfigV2): BotConfig => {
    const { name, command, args } = config;
    return { name, command: [command].concat(args).join(' ') };
  };

  Object.keys(bots).forEach((uuid) => {
    const bot = bots[uuid];
    const config = migrateConfig(bot.config);
    const history = bot.history.map(migrateConfig);
    newBots[uuid] = { ...bot, config, history };
  });

  return { ...db, version: 'v3', bots: newBots };
}

// Schema V1 ------------------------------------------------------------------
// Never used in production

interface DbSchemaV1 { version: 'v1'; }

// Schema V2 ------------------------------------------------------------------
// Used from Intro-event till mid-paasvakantie

export interface DbSchemaV2 {
  version: 'v2';
  matches: IMatchList;
  bots: BotListV2;
  maps: IMapList;
  notifications: Notification[];
}

export interface BotListV2 {
  [key: string /* UUID */]: BotDataV2;
}

export interface BotDataV2 {
  uuid: BotID;
  config: BotConfigV2;
  lastUpdatedAt: Date;
  createdAt: Date;
  history: BotConfigV2[];
}

export interface BotConfigV2 {
  name: string;
  command: string;
  args: string[];
}
