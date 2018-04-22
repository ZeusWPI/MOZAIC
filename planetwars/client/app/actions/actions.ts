import { Match, PlayingMatch, MatchId, MapMeta, PlayerMap, MapId } from '../utils/GameModels';
import {
  BotConfig, BotData, isBotConfig, BotId, MatchConfig, BotSlot, Token,
  BotSlotList
} from '../utils/ConfigModels';
import { Notification } from '../utils/UtilModels';
import GameRunner from '../utils/GameRunner';
import { Config } from '../utils/Config';
import { v4 as uuidv4 } from 'uuid';
import { push } from 'react-router-redux';

import { actionCreator, actionCreatorVoid } from './helpers';
import { IGState } from '../reducers';
import { parseLog } from '../lib/match/log';
// Nav
export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');

// About

// Bots
export type UUID = string;
export const importBotFromDB = actionCreator<BotData>('IMPORT_BOT_FROM_DB');
export const addBot = actionCreator<BotConfig>('ADD_BOT');
export const editBot = actionCreator<BotData>('EDIT_BOT');
export const removeBot = actionCreator<UUID>('REMOVE_BOT');

// Matches
export const importMatchFromDB = actionCreator<Match>('IMPORT_MATCH_FROM_DB');
export const importMatchError = actionCreator<string>('IMPORT_MATCH_ERROR');
export const importMatch = actionCreator<Match>('IMPORT_MATCH');

export interface MatchParams {
  bots: BotSlotList;
  map: MapId;
  maxTurns: number;
}

export const saveMatch = actionCreator<Match>('SAVE_MATCH');
export const matchErrored = actionCreator<MatchId>('MATCH_ERROR');

export function runMatch(params: MatchParams) {
  // TODO: properly type this
  return (dispatch: any, getState: any) => {
    // TODO: split this logic
    const matchId = uuidv4();
    const { map, bots, maxTurns } = params;
    const state: IGState = getState();
    const botNames = Object.keys(params.bots).map((token) => params.bots[token].name);

    const match: Match = {
      status: 'playing',
      uuid: matchId,
      players: botNames,
      map,
      timestamp: new Date(),
      logPath: Config.matchLogPath(matchId),
    };

    const players: BotSlotList = params.bots;
    const gameConfig = { maxTurns, mapFile: state.maps[map].mapPath };
    const config: MatchConfig = { players, gameConfig, logFile: match.logPath };

    dispatch(saveMatch(match));
    // TODO: ideally we'd have a separate action for this
    // dispatch(push(`/matches/${matchId}`));

    const runner = new GameRunner(config);

    runner.on('matchEnded', () => {
      dispatch(completeMatch(matchId));
      const title = 'Match ended';
      const body = `A match on map '${state.maps[params.map].name}' has ended`;
      const link = `/matches/${matchId}`;
      dispatch(addNotification({ title, body, link, type: 'Finished' }));
    });
    runner.on('error', (error) => {
      dispatch(handleMatchError(matchId, error));
      const title = 'Match errored';
      const body = `A match on map '${state.maps[params.map].name}' has errored`;
      const link = `/matches/${matchId}`;
      dispatch(addNotification({ title, body, link, type: 'Error' }));
    });
    runner.run();
  };
}

export function completeMatch(matchId: MatchId) {
  return (dispatch: any, getState: any) => {
    const state: IGState = getState();
    const match = state.matches[matchId];
    if (match.status === 'playing') {
      const matchPlayers = match.players.map((uuid) => {
        const botData = state.bots[uuid];
        return {
          uuid,
          name: botData.config.name,
        };
      });
      const log = parseLog(matchPlayers, match.logPath);
      // TODO: this should go somewhere else
      // calc stats
      const winners = Array.from(log.getWinners()).map((player) => {
        return player.uuid;
      });
      const score: PlayerMap<number> = {};
      log.players.forEach((player) => {
        score[player.uuid] = player.score;
      });

      dispatch(saveMatch({
        ...match,
        status: 'finished',
        stats: {
          winners,
          score,
        },
      }));
    }
  };
}

export function handleMatchError(matchId: MatchId, error: Error) {
  return (dispatch: any, getState: any) => {
    const state: IGState = getState();
    const match = state.matches[matchId];
    if (match.status === 'playing') {
      dispatch(saveMatch({
        ...match,
        status: 'error',
        // TODO: include more information or something
        error: error.message,
      }));
    }
  };
}

// Map
export const importMapFromDB = actionCreator<MapMeta>('IMPORT_MAP_FROM_DB');
export const importMap = actionCreator<MapMeta>('IMPORT_MAP');
export const importMapError = actionCreator<string>('IMPORT_MAP_ERROR');

// Host
export const selectBot = actionCreator<BotSlot & { token: Token }>('SELECT_BOT');
export const unselectBot = actionCreator<BotId>('UNSELECT_BOT');
export const changeLocalBot = actionCreator<{ token: Token, slot: BotSlot }>('CHANGE_LOCAL_BOT');
export const selectMap = actionCreator<string>('SELECT_MAP');

// DB
export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');

// Notifications
export const importNotificationFromDB = actionCreator<Notification>('IMPORT_NOTIFICATION_FROM_DB');
export const addNotification = actionCreator<Notification>('ADD_NOTIFICATION');
export const removeNotification = actionCreator<number>('REMOVE_NOTIFICATION');
export const clearNotifications = actionCreatorVoid('CLEAR_NOTIFICATION');
export const showNotifications = actionCreatorVoid('NOTIFICATION_SHOW');
export const hideNotifications = actionCreatorVoid('NOTIFICATION_HIDE');
export const toggleNotifications = actionCreatorVoid('NOTIFICATION_TOGGLE');
