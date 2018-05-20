/**
 * The global state is the root and source of all data in the app.
 * All components are essentially functions of this state to HTML + JS.
 *
 * There is a big focus on immutability and simple state management.
 * Dynamic changing of object properties is dangerous, and should be avoided,
 * in favour of effectively cloning the objects in question.
 *
 * For separation-of-concerns arguments 'bots' and 'botsPage' are different
 * properties of the state, as one ('bots') could be reused in other pages, and
 * only represents the actual data state, with no little consideration for the
 * logic above it. Same goes for matches.
 */

import { routerReducer, RouterState } from 'react-router-redux';
import { combineReducers } from 'redux';

import { BotsState, botsReducer } from './bots';
import { MatchesState, matchesReducer } from './matches';
import { NotificationsState, notificationReducer } from './notifications';
import { MapsState, mapsReducer } from './maps';

import { HostPageState, hostReducer } from './hostPage';
import { NavbarState, navbarReducer } from './navbar';

export interface GState {
  readonly routing: RouterState;

  readonly bots: BotsState;
  readonly matches: MatchesState;
  readonly notifications: NotificationsState;
  readonly maps: MapsState;

  readonly host: HostPageState;
  readonly navbar: NavbarState;
}

export const initialState: GState = {
  routing: { location: null },

  navbar: { notificationsVisible: false },
  bots: {},
  matches: {},
  maps: {},
  notifications: [],
  host: {
    slots: [],
    serverRunning: false,
  },
};

export const rootReducer = combineReducers<GState>({
  routing: routerReducer,

  bots: botsReducer,
  matches: matchesReducer,
  maps: mapsReducer,
  notifications: notificationReducer,

  host: hostReducer,
  navbar: navbarReducer,
});
