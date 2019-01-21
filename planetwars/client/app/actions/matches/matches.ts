// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');
import * as fs from 'fs';
import * as PwClient from 'mozaic-client';
import { v4 as uuidv4 } from 'uuid';

import * as M from '../../database/models';
import { parseLog, calcStats } from 'planetwars-match-log';
import { GState } from '../../reducers/index';
import { Config } from '../../utils/Config';

import * as Notify from '../notifications';
import * as Host from '../../components/host/Host';
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

    const [command, ...args] = stringArgv(state.bots[bot.botId].command);
    const botConfig = { command, args };
    const address = host;
    const number = 1;
    const token = new Buffer(bot.token, 'hex');
    const connectionData = { token, address: host };
    const logger = new PwClient.Logger(match.logPath);
    const clientParams = { token, address, logger, number, botConfig };

    const runner = new PwClient.Client(clientParams);
    runner.onExit.subscribe(() => {
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

// https://github.com/ZeusWPI/MOZAIC/blob/1f9ab238e96028e3306bfe6b27920f70f9fba430/client/src/test.ts#L38
export function sendGo() {
  return (dispatch: any, getState: any) => {
    const state: GState = getState();
    
    const { runner, matchParams } = state.host;
    if (!matchParams) { throw Error('Under construction'); }

    const config = {
      max_turns: matchParams.maxTurns,
      map_file: state.maps[matchParams.map].mapPath,
    };

    if (runner) {
      console.log("running");
      runner.startGame(config);
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
      if (slot.type === M.BotSlotType.internal) {
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
      address: params.address,
      logFile: match.logPath,
      ctrl_token: params.ctrl_token,
    };

    console.log("This probably doesn't work!!!!");

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

export function completeMatch(matchId: M.MatchId) {
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

    const logContent = fs.readFileSync(match.logPath, 'utf-8');
    const log = parseLog(logContent, match.type);

    const updatedMatch: M.FinishedMatch = {
      ...match,
      stats: calcStats(log),
      status: M.MatchStatus.finished,
    };
    dispatch(saveMatch(updatedMatch));
  };
}

export function handleMatchError(matchId: M.MatchId, error: Error) {
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
