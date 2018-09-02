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

  Object.keys(oldBots).forEach((id: V3.BotId) => {
    const {uuid, config: {name, command}, lastUpdatedAt, createdAt}: V3.BotData = db.bots[id];
    newBots[id] = { uuid, name, command, lastUpdatedAt, createdAt };
  });

  Object.keys(oldMatches).forEach((id: V3.MatchId) => {
    const oldMatch: V3.Match = db.matches[id];
    const { status, uuid, timestamp, logPath, players, map } = oldMatch;
    const botSlots: V4.InternalBotSlot[] = players.map((player: string) => {return {
      // WTF typescript...
      type: V4.BotSlotType.internal as V4.BotSlotType.internal,
      token: '',
      connected: true,
      botId: player,
      name: newBots[player].name,
      clientid: -1,
    }});
    const matchParams: V4.HostedMatchProps = {
      type: V4.MatchType.hosted,
      status: V4.MatchStatus[status],
      uuid,
      timestamp,
      network: {
        host: 'localhost',
        port: 0,
      },
      logPath,
      players: botSlots,
      maxTurns: 0,
      map,
    };
    switch (oldMatch.status) {
      case 'playing':
        const abortedMatch: V4.ErroredHostedMatch = {
          ...matchParams,
          status: V4.MatchStatus.error,
          error: "This match was aborted during migration",
        };
        newMatches[id] = abortedMatch;
        break;
      case 'finished':
        const finishedMatch: V4.FinishedHostedMatch = {
          ...matchParams,
          status: V4.MatchStatus.finished,
          stats: {
            ...oldMatch.stats,
            winners: oldMatch.stats.winners.map((botuuid) => players.indexOf(botuuid)) || [],
          },
        };
        newMatches[id] = finishedMatch;
        break;
      case 'error':
        const errMatch: V4.ErroredHostedMatch = {
          ...matchParams,
          status: V4.MatchStatus.error,
          error: oldMatch.error,
        };
        newMatches[id] = errMatch;
        break;
    }
  });

  return { ...db, bots: newBots, matches: newMatches, version: 'v4' };
}
