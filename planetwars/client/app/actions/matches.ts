import * as M from '../utils/database/models';
import * as Varia from './varia';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as PwClient from 'mozaic-client';

import { actionCreator } from './helpers';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '../utils/Config';
import { GState } from '../reducers/index';
import { parseLog } from '../lib/match/MatchLog';
import { calcScores } from '../lib/match';

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
    network: params.address,
  };
  return match;
}

export function joinMatch(host: M.Address, bot: M.InternalBotSlot) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();

    const matchId = uuidv4();

    const match: M.JoinedMatch =  {
      uuid: matchId,
      type: M.MatchType.joined,
      status: M.MatchStatus.playing,
      timestamp: new Date(),
      network: host,
      logPath: Config.matchLogPath(matchId),
      bot,
    };

    dispatch(saveMatch(match));

    const botData = state.bots[bot.botId];
    const argv = stringArgv(botData.command);
    const botConfig = {
      command: argv[0],
      args: argv.slice(1),
    };

    const config = {
      clients: [
        {
          botConfig,
          token: bot.token,
          number: 1,
        },
      ],
      address: host,
      logFile: match.logPath,
    };

    // TODO: remove this dupe
    const runner = new PwClient.ClientRunner(config);
    runner.onComplete.subscribe(() => {
      dispatch(completeMatch(match.uuid));
      const title = 'Match ended';
      const body = `A remote match has ended`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Finished' }));
    });

    runner.onError.subscribe((error) => {
      dispatch(handleMatchError(match.uuid, error));
      const title = 'Match errored';
      const body = `A remote match on map has errored`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Error' }));
    });

    runner.run();
  };
}

export function runMatch(params: M.MatchParams) {
  // TODO: properly type this
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const { map, players, maxTurns } = params;
    const match = createHostedMatch(params);
    dispatch(saveMatch(match));

    const playerConfigs = players.map((slot, idx) => {
      let botConfig;
      if (slot.type === 'internal') {
        const botData = state.bots[slot.botId];
        const argv = stringArgv(botData.command);
        botConfig = {
          command: argv[0],
          args: argv.slice(1),
        };
      }
      return {
        name: slot.name,
        token: slot.token,
        number: idx + 1,
        botConfig,
      };
    });

    const config: PwClient.MatchParams = {
      players: playerConfigs,
      mapFile: state.maps[map].mapPath,
      maxTurns,
      address: params.address,
      logFile: match.logPath,
    };

    const runner = new PwClient.MatchRunner(Config.matchRunner, config);
    runner.onComplete.subscribe(() => {
      dispatch(completeMatch(match.uuid));
      const title = 'Match ended';
      const body = `A match on map '${state.maps[params.map].name}' has ended`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Finished' }));
    });

    runner.onError.subscribe((error) => {
      dispatch(handleMatchError(match.uuid, error));
      const title = 'Match errored';
      const body = `A match on map '${state.maps[params.map].name}' has errored`;
      const link = `/matches/${match.uuid}`;
      dispatch(Varia.addNotification({ title, body, link, type: 'Error' }));
    });

    runner.run();
  };
}


function completeMatch(matchId: M.MatchId) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const match = state.matches[matchId];
    if (match.status !== M.MatchStatus.playing) { throw new Error('We suck at coding.'); }

    let players;
    if (match.type === M.MatchType.hosted) {
      players = match.players;
    } else {
      players = [match.bot];
    }

    const stats = getStats(match.logPath);
    const updatedMatch: M.FinishedMatch = {
      ...match,
      stats,
      status: M.MatchStatus.finished,
    };
    dispatch(saveMatch(updatedMatch));
  };
}

function getStats(logPath: string): M.MatchStats {
  const log = parseLog(logPath);
  console.log('winners');
  console.log(log.getWinners());
  return {
    winners: Array.from(log.getWinners()),
    score: calcScores(log),
  };
}

function handleMatchError(matchId: M.MatchId, error: Error) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const match = state.matches[matchId];
    if (match.type !== M.MatchType.hosted) { throw new Error('We suck at coding.'); }
    if (match.status !== M.MatchStatus.playing) { throw new Error('We suck at coding.'); }

    const updatedMatch: M.ErroredMatch = {
      ...match,
      status: M.MatchStatus.error,
      // TODO: include more information or something
      error: error.message,
    };
    dispatch(saveMatch(updatedMatch));
  };
}
