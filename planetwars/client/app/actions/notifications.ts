import * as M from '../database/models';
import { createAction } from 'typesafe-actions';

export const addNotification = createAction(
  'ADD_NOTIFICATION',
  (resolve) => {
    return (notification: M.Notification) => resolve(notification);
  },
);

export const removeNotification = createAction(
  'REMOVE_NOTIFICATION',
  (resolve) => {
    return (idx: number) => resolve(idx);
  },
);

export const clearNotifications = createAction('CLEAR_NOTIFICATIONS');

export const showNotifications = createAction('NOTIFICATION_SHOW');
export const hideNotifications = createAction('NOTIFICATION_HIDE');
export const toggleNotifications = createAction('NOTIFICATION_TOGGLE');
