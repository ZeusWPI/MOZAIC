import { IBotConfig, IBotData, isBotConfig, BotID } from '../utils/ConfigModels';
import { IMatchMetaData } from '../utils/GameModels';
import { INotification } from '../components/Navbar';

import { actionCreator, actionCreatorVoid } from './helpers';
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

export const matchStarted = actionCreatorVoid('MATCH_STARTED');
export const matchFinished = actionCreatorVoid('MATCH_FINISHED');
export const matchCrashed = actionCreator<any>('MATCH_CRASHED');

// PlayPage / Setting up a match
export const selectBot = actionCreator<BotID>('SELECT_BOT');
export const unselectBot = actionCreator<BotID>('UNSELECT_BOT');
export const unselectBotAll = actionCreator<BotID>('UNSELECT_BOT_ALL');

// DB
export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');

// Notifications
export const addNotification = actionCreator<INotification>('ADD_NOTIFICATION');
