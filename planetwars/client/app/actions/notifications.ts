import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../database/models';

// Notifications
export const addNotification = actionCreator<M.Notification>('ADD_NOTIFICATION');
export const removeNotification = actionCreator<number>('REMOVE_NOTIFICATION');
export const clearNotifications = actionCreatorVoid('CLEAR_NOTIFICATION');
export const showNotifications = actionCreatorVoid('NOTIFICATION_SHOW');
export const hideNotifications = actionCreatorVoid('NOTIFICATION_HIDE');
export const toggleNotifications = actionCreatorVoid('NOTIFICATION_TOGGLE');
