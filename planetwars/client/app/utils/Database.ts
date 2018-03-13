import * as low from 'lowdb';
import * as FileAsync from 'lowdb/adapters/FileAsync';

import * as A from '../actions/actions';
import { IBotConfig } from './ConfigModels';
import { IMatchMetaData } from './GameModels';
import { store as globalStore } from '../index';
import { IGState } from '../reducers';

const adapter = new FileAsync('db.json');
const database = low<IDbSchema, typeof adapter>(adapter);

export interface IDbSchema {
  matches: IMatchMetaData[];
  bots: IBotConfig[];
}

export const SCHEMA = {
  MATCHES: 'matches',
  BOTS: 'bots',
};

/*
 * This function will populate the store initially with the DB info and
 * subscribe itself to changes so it can propage the relevant ones to the DB.
 */
export function bindToStore(store: any) {
  database
    .then((db) => db.defaults({ matches: [], bots: [] }).write())
    .then((db) => {
      db.matches.forEach((match) => {
        store.dispatch(A.importMatchFromDB(match));
      });

      db.bots.forEach((bot) => {
        store.dispatch(A.importBotFromDB(bot));
      });
    })
    .then(initializeListeners)
    .then(() => store.subscribe(changeListener))
    .catch((err) => {
      store.dispatch(A.dbError(err));
      console.log(err);
    });
}

/*
 * This gets procced when the state changes and checks whether the specific
 * listeners need updating, and dispatches action when they require so.
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
 * This way we precent a certain SYNC_DB event on the first, possible irrelevant,
 * state change.
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
  new TableListener<IMatchMetaData[]>(
    (state: IGState) => state.matchesPage.matches,
    SCHEMA.MATCHES,
  ),
  new TableListener<IBotConfig[]>(
    (state: IGState) => state.botsPage.bots,
    SCHEMA.BOTS,
  ),
];
