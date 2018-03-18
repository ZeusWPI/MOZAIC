import * as low from 'lowdb';
import * as FileAsync from 'lowdb/adapters/FileAsync';

import * as A from '../actions/actions';
import { IBotList, IBotConfig } from './ConfigModels';
import { IMatchMetaData, IMatchList } from './GameModels';
import { store as globalStore } from '../index';
import { IGState } from '../reducers';

export interface IDbSchemaV2 {
  version: 'v2';
  matches: IMatchList;
  bots: IBotList;
}

// Utility to allow accessing the DB somewhat more safe. You can these string
// properties as key so that you have some typechecking over typo's.
export const SCHEMA = {
  VERSION: 'version',
  MATCHES: 'matches',
  BOTS: 'bots',
};

// ----------------------------------------------------------------------------
// Initialisation
// ----------------------------------------------------------------------------

const adapter = new FileAsync('db.json');
const database = low<IDbSchemaV2, typeof adapter>(adapter);

/*
 * This function will populate the store initially with the DB info and
 * subscribe itself to changes so it can propage the relevant ones to the DB.
 */
export function bindToStore(store: any) {
  database
    .then((db) => db.defaults({ version: 'v2', matches: {}, bots: {} }).write())
    .then((db) => {
      if (db.version !== 'v2') {
        return migrateOld(db);
      }
      return db;
    })
    .then((db) => {
      Object.keys(db.matches).forEach((uuid) => {
        store.dispatch(A.importMatchFromDB(db.matches[uuid]));
      });
      Object.keys(db.matches).forEach((uuid) => {
        store.dispatch(A.importBotFromDB(db.bots[uuid]));
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
];

// ----------------------------------------------------------------------------
// Migrations
// ----------------------------------------------------------------------------

type DbSchema = IDbSchemaV1 | IDbSchemaV2;

interface IDbSchemaV1 {
  version: string;
  matches: IMatchMetaData[];
  bots: IBotConfig[];
}

// Let's not consider migrating old DB's yet.
// For now this is only for def purposes.
function migrateOld(db: DbSchema): IDbSchemaV2 {
  return {
    version: 'v2',
    matches: {},
    bots: {},
  };
}
