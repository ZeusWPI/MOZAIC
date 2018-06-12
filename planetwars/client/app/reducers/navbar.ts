import { combineReducers } from 'redux';
import * as actions from '../actions';
import { ActionType, getType } from 'typesafe-actions';

export type Action = ActionType<typeof actions>;

// TODO: Remove notificationsVisible from global store
export interface NavbarState {
  readonly notificationsVisible: boolean;
}

export const navbarReducer = combineReducers<NavbarState>({
  notificationsVisible: (state = false, action: Action) => {
    switch (action.type) {
      case getType(actions.showNotifications): {
        return true;
      }
      case getType(actions.hideNotifications): {
        return false;
      }
      case getType(actions.toggleNotifications): {
        return !state;
      }
      default: {
        return state;
      }
    }
  },
});
