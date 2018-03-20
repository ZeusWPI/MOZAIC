import { IMatchMetaData, IMapMeta } from '../utils/GameModels';
import { IBotConfig, IBotData, isBotConfig, BotID, IMatchConfig } from '../utils/ConfigModels';
import { INotification } from '../utils/UtilModels';
import GameRunner from '../utils/GameRunner';

import { actionCreator, actionCreatorVoid } from './helpers';
import { IGState } from '../reducers';
// Nav
export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');

// About
export const incrementAbout = actionCreatorVoid('TEST');

// Bots
export type UUID = string;
export const importBotFromDB = actionCreator<IBotData>('IMPORT_BOT_FROM_DB');
export const addBot = actionCreator<IBotConfig>('ADD_BOT');
export const editBot = actionCreator<IBotData>('EDIT_BOT');
export const removeBot = actionCreator<UUID>('REMOVE_BOT');

// Matches
export const importMatchFromDB = actionCreator<IMatchMetaData>('IMPORT_MATCH_FROM_DB');
export const importMatchError = actionCreator<string>('IMPORT_MATCH_ERROR');
export const importMatch = actionCreator<IMatchMetaData>('IMPORT_MATCH');

export interface MatchParams {
    bots: BotID[],
  }

export const matchStarted = actionCreatorVoid('MATCH_STARTED');
export const matchFinished = actionCreatorVoid('MATCH_FINISHED');
export const matchCrashed = actionCreator<any>('MATCH_CRASHED');

export function runMatch(params: MatchParams) {
  // TODO: properly type this
  return (dispatch: any, getState: any) => {
    let state: IGState = getState();
    const config: IMatchConfig = {
      players: params.bots.map( (botID) => {
        return state.bots[botID].config;
      }),
      game_config: {
        map_file: 'hex.json',
        max_turns: 100,
      },
    };
    let runner = new GameRunner(config);
    runner.on('matchStarted', () => dispatch(matchStarted()));
    runner.on('matchEnded', () => dispatch(matchFinished()));
    runner.on('error', (err) => dispatch(matchCrashed(err)));
    runner.run();
  }
}

// Map
export const importMapFromDB = actionCreator<IMapMeta>('IMPORT_MAP_FROM_DB');
export const importMap = actionCreator<IMapMeta>('IMPORT_MAP');
export const importMapError = actionCreator<string>('IMPORT_MAP_ERROR');

// PlayPage / Setting up a match
export const selectBot = actionCreator<BotID>('SELECT_BOT');
export const unselectBot = actionCreator<BotID>('UNSELECT_BOT');
export const unselectBotAll = actionCreator<BotID>('UNSELECT_BOT_ALL');

// DB
export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');

// Notifications
export const importNotificationFromDB = actionCreator<INotification>('IMPORT_NOTIFICATION_FROM_DB');
export const addNotification = actionCreator<INotification>('ADD_NOTIFICATION');
export const removeNotification = actionCreator<number>('REMOVE_NOTIFICATION');
export const clearNotifications = actionCreatorVoid('CLEAR_NOTIFICATION');
export const showNotifications = actionCreatorVoid('NOTIFICATION_SHOW');
export const hideNotifications = actionCreatorVoid('NOTIFICATION_HIDE');
export const toggleNotifications = actionCreatorVoid('NOTIFICATION_TOGGLE');
