import * as A from '../actions';
import * as M from '../database/models';

export type NotificationsState = M.Notification[];
export function notificationReducer(state: NotificationsState = [], action: any) {
  if (A.addNotification.test(action)) {
    const newState = state.slice();
    newState.push(action.payload);
    return newState;
  } else if (A.removeNotification.test(action)) {
    const newState = state.slice();
    newState.splice(action.payload, 1);
    return newState;
  } else if (A.clearNotifications.test(action)) {
    return [];
  }
  return state;
}
