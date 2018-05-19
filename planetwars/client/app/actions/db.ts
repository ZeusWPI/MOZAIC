import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../database/models';

export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');
export const importMapFromDB = actionCreator<M.MapMeta>('IMPORT_MAP_FROM_DB');
export const importBotFromDB = actionCreator<M.Bot>('IMPORT_BOT_FROM_DB');
export const importNotificationFromDB = actionCreator<M.Notification>('IMPORT_NOTIFICATION_FROM_DB');