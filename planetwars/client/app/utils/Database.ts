import { remote } from 'electron';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as low from 'lowdb';
import * as FileAsync from 'lowdb/adapters/FileAsync';
import log from 'electron-log';

import * as A from '../actions/index';
import * as M from './database/models';
import { store as globalStore } from '../index';
import { GState } from '../reducers';
import { Config } from './Config';
import { migrate } from './database/migrate';

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

import * as V4 from './database/migrationV4';
type DbSchema = V4.DbSchema;
const latestVersion = V4.defaults.version;

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
const adapter = new FileAsync<DbSchema>(dbPath);
const database = Promise.resolve(low<typeof adapter>(adapter));
type dbType = low.LowdbAsync<DbSchema>;

/*
 * This function will populate the store initially with the DB info and
 * subscribe itself to changes so it can propage the relevant ones to the DB.
 */
export function bindToStore(store: any): Promise<void> {
  return database
    .tap((db: dbType) => db.defaults(V4.defaults).write())
    .tap((db: dbType) => {
      if (db.get(SCHEMA.VERSION, 'v1').value() !== latestVersion) {
        db.setState(migrate(db.value())).write();
      }
    })
    .then((db: dbType) => db.getState())
    .then((db: DbSchema) => {
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
      db.notifications.forEach((notification: M.Notification) => {
        store.dispatch(A.importNotificationFromDB(notification));
      });
    })
    .then(initializeListeners)
    .then(() => store.subscribe(changeListener))
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
  const state: GState = globalStore.getState();
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
  const state: GState = globalStore.getState();
  listeners.forEach((l) => l.select(state));
}

type Selector<T> = (state: GState) => T;
type Mutator<T> = (newValue: T) => void;

class TableListener<T> {
  public oldValue: T;

  constructor(private selector: Selector<T>, private accessor: string) { }

  public select(state: GState): T {
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
  new TableListener<M.MatchList>(
    (state: GState) => state.matches,
    SCHEMA.MATCHES,
  ),
  new TableListener<M.BotList>(
    (state: GState) => state.bots,
    SCHEMA.BOTS,
  ),
  new TableListener<M.MapList>(
    (state: GState) => state.maps,
    SCHEMA.MAPS,
  ),
  new TableListener<M.Notification[]>(
    (state: GState) => state.notifications,
    SCHEMA.NOTIFICATIONS,
  ),
];
