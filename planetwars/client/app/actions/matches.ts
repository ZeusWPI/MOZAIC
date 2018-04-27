import * as M from '../utils/database/models';
import * as Varia from './varia';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as PwClient from 'mozaic-client';

import { actionCreator } from './helpers';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '../utils/Config';
import { GState } from '../reducers/index';
import { parseLog } from '../lib/match/log/index';
import GameRunner from '../utils/GameRunner';

export const importMatchFromDB = actionCreator<M.Match>('IMPORT_MATCH_FROM_DB');
export const importMatchError = actionCreator<string>('IMPORT_MATCH_ERROR');
export const importMatch = actionCreator<M.Match>('IMPORT_MATCH');

export const saveMatch = actionCreator<M.Match>('SAVE_MATCH');
export const matchErrored = actionCreator<M.MatchId>('MATCH_ERROR');

function createHostedMatch(params: M.MatchParams): M.HostedMatch {
  const matchId = uuidv4();
  const { map, players, maxTurns } = params;

  const match: M.HostedMatch = {
    type: M.MatchType.hosted,
    status: M.MatchStatus.playing,
    uuid: matchId,
    players,
    maxTurns,
    map,
    timestamp: new Date(),
    logPath: Config.matchLogPath(matchId),
    network: { host: '127.0.0.1', port: 9142 },
  };
  return match;
}


// TODO: don't make this an action
export function runBot(match: M.MatchProps, bot: M.InternalBotSlot) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const botData = state.bots[bot.botId];
    const connData = {
      token: Buffer.from(bot.token, 'hex'),
      address: match.network,
    };
    const argv = stringArgv(botData.command);
    const botConfig = {
      command: argv[0],
      args: argv.slice(1),
    };
    const client = new PwClient.Client(connData, botConfig);
    client.run();
  };
}

export function runMatch(params: M.MatchParams) {
  // TODO: properly type this
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const { map, players, maxTurns } = params;
    const match = createHostedMatch(params);
    dispatch(saveMatch(match));

    const playerConfigs = players.map(({ token, name }) => ({ token, name }));
    const gameConfig = { maxTurns, mapFile: state.maps[map].mapPath };
    const config: M.MatchConfig = {
      gameConfig,
      players: playerConfigs,
      logFile: match.logPath,
    };

    const runner = new GameRunner(config);
    runner.on('matchEnded', () => {
      dispatch(completeHostedMatch(match.uuid));
      const title = 'Match ended';
      const body = `A match on map '${state.maps[params.map].name}' has ended`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Finished' }));
    });
    runner.on('error', (error) => {
      dispatch(handleHostedMatchError(match.uuid, error));
      const title = 'Match errored';
      const body = `A match on map '${state.maps[params.map].name}' has errored`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Error' }));
    });
    runner.run();

    setTimeout(() => {
      match.players.forEach((bot) => {
        if (bot.type === 'internal') {
          dispatch(runBot(match, bot));
        }
      });
    }, 5000);
  };
}

function completeHostedMatch(matchId: M.MatchId) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const match = state.matches[matchId];
    if (match.type !== M.MatchType.hosted) { throw new Error('We suck at coding.'); }
    if (match.status !== M.MatchStatus.playing) { throw new Error('We suck at coding.'); }

    const stats = getStats(match.logPath, match.players);
    const updatedMatch: M.FinishedHostedMatch = {
      ...match,
      stats,
      status: M.MatchStatus.finished,
    };
    dispatch(saveMatch(updatedMatch));
  };
}

function getStats(logPath: string, players: M.BotSlot[]): M.MatchStats {
  const matchPlayers = players.map(({ token, name }) => ({ uuid: token, name }));
  const log = parseLog(matchPlayers, logPath);
  const winners = Array.from(log.getWinners()).map((p) => p.uuid);

  const score = log.players.reduce((scores, player) => {
    scores[player.uuid] = player.score;
    return scores;
  }, {} as M.PlayerMap<number>);

  return { winners, score };
}

function handleHostedMatchError(matchId: M.MatchId, error: Error) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const match = state.matches[matchId];
    if (match.type !== M.MatchType.hosted) { throw new Error('We suck at coding.'); }
    if (match.status !== M.MatchStatus.playing) { throw new Error('We suck at coding.'); }

    const updatedMatch: M.ErroredHostedMatch = {
      ...match,
      status: M.MatchStatus.error,
      // TODO: include more information or something
      error: error.message,
    };
    dispatch(saveMatch(updatedMatch));
  };
}
