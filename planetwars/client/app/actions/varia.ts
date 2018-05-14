import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../utils/database/models';

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
export const selectBot = actionCreator<M.BotSlot>('SELECT_BOT');
export const unselectBot = actionCreator<M.BotId>('UNSELECT_BOT');
export const changeLocalBot = actionCreator<M.BotSlot>('CHANGE_LOCAL_BOT');
export const selectMap = actionCreator<string>('SELECT_MAP');
export const playerConnected = actionCreator<M.BotSlot>('PLAYER_CONNECT');
export const playerDisconnected = actionCreator<M.BotSlot>('PLAYER_DISCONNECT');

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
