import { combineReducers } from 'redux';

import * as A from '../actions';

// TODO: Remove notificationsVisible from global store
export interface NavbarState {
  readonly notificationsVisible: boolean;
}

export const navbarReducer = combineReducers<NavbarState>({
  notificationsVisible: (state = false, action) => {
    if (A.showNotifications.test(action)) {
      return true;
    } else if (A.hideNotifications.test(action)) {
      return false;
    } else if (A.toggleNotifications.test(action)) {
      return !state;
    }
    return state;
  },
});
