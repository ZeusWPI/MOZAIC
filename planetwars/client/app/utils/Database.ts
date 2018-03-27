import { remote } from 'electron';

import * as path from 'path';
import * as low from 'lowdb';
import * as FileAsync from 'lowdb/adapters/FileAsync';

import * as A from '../actions/actions';
import { IBotList, IBotConfig, IBotListv2, IBotDatav2 } from './ConfigModels';
import { Match, IMatchList, IMapList } from './GameModels';
import { store as globalStore } from '../index';
import { IGState } from '../reducers';
import { Notification } from '../utils/UtilModels';
import { Config } from './Config';

export interface DbSchemaV2 {
  version: 'v2';
  matches: IMatchList;
  bots: IBotListv2;
  maps: IMapList;
  notifications: Notification[];
}

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
const database = low<DbSchemaV2, typeof adapter>(adapter);

/*
 * This function will populate the store initially with the DB info and
 * subscribe itself to changes so it can propage the relevant ones to the DB.
 */
export function bindToStore(store: any): Promise<void> {
  return database
    .then((db) => db.defaults({
      version: 'v3',
      matches: {},
      bots: {},
      maps: {},
      notifications: [],
    }).write())
    .then((db) => {
      if (db.version as string !== 'v3') {
        return migrateOld(db);
      }
      return db;
    })
    .then((db) => {
      // TODO: these JSON objects should be validated to avoid weird runtime
      // errors elsewhere in the code
      Object.keys(db.bots).forEach((uuid) => {
        store.dispatch(A.importBotFromDB(db.bots[uuid]));
      });
      Object.keys(db.maps).forEach((uuid) => {
        store.dispatch(A.importMapFromDB(db.maps[uuid]));
      });
      Object.keys(db.matches).forEach((uuid) => {
        const matchData = db.matches[uuid];
        store.dispatch(A.importMatchFromDB({
          ...matchData,
          timestamp: new Date(matchData.timestamp),
        }));
      });
      db.notifications.forEach((notification) => {
        store.dispatch(A.importNotificationFromDB(notification));
      });
    })
    .then(initializeListeners)
    .then(() => store.subscribe(changeListener))
    .catch((err) => {
      store.dispatch(A.dbError(err));
      console.log(err);
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

type DbSchema = DbSchemaV2 | DbSchemaV3;
type OldDbSchema = DbSchemaV2; // | DbSchemaV1
// interface IDbSchemaV1 {
//   version: string;
//   matches: Match[];
//   bots: IBotConfig[];
// }

// Let's not consider migrating old DB's yet.
// For now this is only for dev purposes.
function migrateOld(db: OldDbSchema): DbSchemaV3 {
  if (db.version as string === 'v2') {
    const bots: IBotListv2 = db.bots;
    const newBots: IBotList = {};
    Object.keys(bots).forEach((uuid) => {
      newBots[uuid] = {
        uuid,
        config: {
          name: bots[uuid].config.name,
          command: [bots[uuid].config.command].concat(bots[uuid].config.args).join(" "),
        },
        lastUpdatedAt: bots[uuid].lastUpdatedAt,
        createdAt: bots[uuid].createdAt,
        history: bots[uuid].history,
      };
    });
    return {
      version: 'v3',
      matches: db.matches,
      bots: newBots,
      maps: db.maps,
      notifications: db.notifications,
    };
  } else {
    return {
      version: 'v3',
      matches: {},
      bots: {},
      maps: {},
      notifications: [],
    };
  }
}
