import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../utils/database/models';
import * as PwClient from 'mozaic-client';

// Nav
export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');

// Bots
export const importBotFromDB = actionCreator<M.Bot>('IMPORT_BOT_FROM_DB');
export const addBot = actionCreator<{ name: string, command: string }>('ADD_BOT');
export const editBot = actionCreator<M.Bot>('EDIT_BOT');
export const removeBot = actionCreator<M.BotId>('REMOVE_BOT');

// Map
export const importMapFromDB = actionCreator<M.MapMeta>('IMPORT_MAP_FROM_DB');
export const importMap = actionCreator<M.MapMeta>('IMPORT_MAP');
export const importMapError = actionCreator<string>('IMPORT_MAP_ERROR');

// Host
export const setupServer = actionCreator<M.ServerParams>('SETUP_SERVER');
export const changeBotSlot = actionCreator<M.BotSlot>('CHANGE_BOT_SLOT');
export const selectMap = actionCreator<string>('SELECT_MAP');
export const playerConnected = actionCreator<M.Token>('PLAYER_CONNECT');
export const playerDisconnected = actionCreator<M.Token>('PLAYER_DISCONNECT');
export const serverStarted = actionCreator<PwClient.MatchRunner>('SERVER_STARTED');

// DB
export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');

// Notifications
export const importNotificationFromDB = actionCreator<M.Notification>('IMPORT_NOTIFICATION_FROM_DB');
export const addNotification = actionCreator<M.Notification>('ADD_NOTIFICATION');
export const removeNotification = actionCreator<number>('REMOVE_NOTIFICATION');
export const clearNotifications = actionCreatorVoid('CLEAR_NOTIFICATION');
export const showNotifications = actionCreatorVoid('NOTIFICATION_SHOW');
export const hideNotifications = actionCreatorVoid('NOTIFICATION_HIDE');
export const toggleNotifications = actionCreatorVoid('NOTIFICATION_TOGGLE');
