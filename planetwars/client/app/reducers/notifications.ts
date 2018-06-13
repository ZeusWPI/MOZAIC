import * as actions from '../actions/notifications';
import * as M from '../database/models';
import { ActionType, getType } from 'typesafe-actions';

export type Action = ActionType<typeof actions>;
export type NotificationsState = M.Notification[];

export function notificationReducer(
  state: NotificationsState = [],
  action: Action,
) {
  switch (action.type) {
    case getType(actions.addNotification): {
      const newState = state.slice();
      newState.push(action.payload);
      return newState;
    }
    case getType(actions.removeNotification): {
      const newState = state.slice();
      newState.splice(action.payload, 1);
      return newState;
    }
    case getType(actions.clearNotifications): {
      return [];
    }
    default: {
      return state;
    }
  }
}
