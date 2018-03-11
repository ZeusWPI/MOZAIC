import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import { IBotConfig } from './ConfigModels';
import { IMatchMetaData } from './GameModels';

const adapter = new FileSync('db.json');
export const db = low<IDbSchema, typeof adapter>(adapter);

// TODO: Subscribe to redux store

interface IDbSchema {
  games: IMatchMetaData[];
  bots: IBotConfig[];
}

export const SCHEMA = {
  GAMES: 'games',
  BOTS: 'bots',
};

const write: IDbSchema = db.defaults({ games: [], bots: [] }).write();
