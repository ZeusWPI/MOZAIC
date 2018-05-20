// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as PwClient from 'mozaic-client';
import { Logger } from 'mozaic-client';
import { v4 as uuidv4 } from 'uuid';

import * as M from '../../database/models';
import { parseLogFile, calcStats } from '../../lib/match';
import { GState } from '../../reducers/index';
import { Config } from '../../utils/Config';

import * as Notify from '../notifications';
import * as Host from './hosting';
import { actionCreator } from '../helpers';
import { createLog, addLogEntry } from '..';

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

    const match: M.JoinedMatch = {
      uuid: matchId,
      type: M.MatchType.joined,
      status: M.MatchStatus.playing,
      timestamp: new Date(),
      network: host,
      logPath: Config.matchLogPath(matchId),
      bot,
    };

    dispatch(saveMatch(match));
    dispatch(createLog(match.uuid));

    const botData = state.bots[bot.botId];
    const argv = stringArgv(botData.command);
    const botConfig = {
      command: argv[0],
      args: argv.slice(1),
    };

    const logger = new Logger(match.logPath);

    const config = {
      clients: [
        {
          botConfig,
          token: bot.token,
          number: 1,
        },
      ],
      address: host,
      logger,
    };

    // TODO: remove this dupe
    const runner = new PwClient.ClientRunner(config);
    runner.onComplete.subscribe(() => {
      dispatch(completeMatch(match.uuid));
      const title = 'Match ended';
      const body = `A remote match has ended`;
      const link = `/matches/${match.uuid}`;
      dispatch(Notify.addNotification({ title, body, link, type: 'Finished' }));
    });

    runner.onError.subscribe((error: Error) => {
      console.log(error);
      dispatch(handleMatchError(match.uuid, error));
      const title = 'Match errored';
      const body = `A remote match on map has errored`;
      const link = `/matches/${match.uuid}`;
      dispatch(Notify.addNotification({ title, body, link, type: 'Error' }));
    });

    logger.onEntry.subscribe((entry) => {
      dispatch(addLogEntry({
        matchId: match.uuid,
        entry,
      }));
    });

    runner.run();
  };
}

export function sendGo() {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    if (state.host.runner) {
      console.log("running");
      state.host.runner.start_match();
    }
  };
}

export function runMatch() {
  // TODO: properly type this
  return (dispatch: any, getState: any) => {
    const state: GState = getState();

    if (!state.host.matchParams) {
      return;
    }

    const params = state.host.matchParams;
    const { map, players, maxTurns } = params;
    const match = createHostedMatch(params);
    dispatch(saveMatch(match));
    dispatch(createLog(match.uuid));

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
      ctrl_token: params.ctrl_token,
    };

    const runner = new PwClient.MatchRunner(Config.matchRunner, config);
    runner.onComplete.subscribe(() => {
      dispatch(completeMatch(match.uuid));
      const title = 'Match ended';
      const body = `A match on map '${state.maps[params.map].name}' has ended`;
      const link = `/matches/${match.uuid}`;
      dispatch(Notify.addNotification({ title, body, link, type: 'Finished' }));
    });

    runner.onError.subscribe((error) => {
      dispatch(handleMatchError(match.uuid, error));
      const title = 'Match errored';
      const body = `A match on map '${state.maps[params.map].name}' has errored`;
      const link = `/matches/${match.uuid}`;
      dispatch(Notify.addNotification({ title, body, link, type: 'Error' }));
    });

    runner.onPlayerConnected.subscribe((playerNumber) => {
      dispatch(Host.playerConnected(players[playerNumber - 1].token));
    });

    runner.onPlayerDisconnected.subscribe((playerNumber) => {
      dispatch(Host.playerDisconnected(players[playerNumber - 1].token));
    });

    runner.logger.onEntry.subscribe((entry) => {
      dispatch(addLogEntry({
        matchId: match.uuid,
        entry,
      }));
    });


    runner.run();
    dispatch(Host.serverStarted(runner));
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

    const log = parseLogFile(match.logPath, match.type);

    const updatedMatch: M.FinishedMatch = {
      ...match,
      stats: calcStats(log),
      status: M.MatchStatus.finished,
    };
    dispatch(saveMatch(updatedMatch));
  };
}

function handleMatchError(matchId: M.MatchId, error: Error) {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    const match = state.matches[matchId];
    if (match.type !== M.MatchType.hosted) { /* throw new Error('We suck at coding.'); */ return; }
    if (match.status !== M.MatchStatus.playing) { /*throw new Error('We suck at coding.');*/ return; }

    const updatedMatch: M.ErroredMatch = {
      ...match,
      status: M.MatchStatus.error,
      // TODO: include more information or something
      error: error.message,
    };
    dispatch(saveMatch(updatedMatch));
  };
}
