import log from 'electron-log';

import * as V1 from './migrationV1';
import * as V2 from './migrationV2';
import * as V3 from './migrationV3';
import * as V4 from './migrationV4';

// ----------------------------------------------------------------------------
// Migrations
// ----------------------------------------------------------------------------

type DbSchema = V1.DbSchema | V2.DbSchema | V3.DbSchema | V4.DbSchema;

type Migrator<Old extends DbSchema, New extends DbSchema> = (db: Old) => New;
export function migrate(oldDb: DbSchema): V4.DbSchema {
  let db = oldDb;

  const upgrade = <Old extends DbSchema, New extends DbSchema>
    (from: string, to: string, migrator: Migrator<Old, New>) => {
    log.info(`[DB] Upgrading from ${from} to ${to}`);
    db = migrator(db as Old);
  };

  log.info('[DB] Starting migration');
  while (db.version !== 'v4') {
    switch (db.version) {
      case 'v1': upgrade('V1', 'V2', upgradeV1); break;
      case 'v2': upgrade('V2', 'V3', upgradeV2); break;
      case 'v3': upgrade('V3', 'V4', upgradeV3); break;
      default:
        log.error(`[DB] Unknown database version. ${db}`);
        throw new Error(`[DB] Unknown database version. ${db}`);
    }
  }
  return db;
}

function upgradeV1(db: V1.DbSchema): V2.DbSchema {
  log.warn('[DB] Somebody is messing with db-versions (v1 was never used)!');
  return {
    version: 'v2',
    matches: {},
    bots: {},
    maps: {},
    notifications: [],
  };
}

function upgradeV2(db: V2.DbSchema): V3.DbSchema {
  const bots: V2.BotList = db.bots;
  const newBots: V3.BotList = {};

  const migrateConfig = (config: V2.BotConfig): V3.BotConfig => {
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

function upgradeV3(db: V3.DbSchema): V4.DbSchema {
  const oldBots: V3.BotList = db.bots;
  const newBots: V4.BotList = {};
  const oldMatches: V3.MatchList = db.matches;
  const newMatches: V4.MatchList = {};

  // alert('Somebody forgot to implement a migration, this might cause fatal issues if you don\'t abort');
  throw new Error('Somebody forgot to implement a migration!');
  // return { ...db, bots: newBots, matches: newMatches, version: 'v4' };
}
