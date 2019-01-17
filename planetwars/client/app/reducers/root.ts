import { History } from 'history';
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

import { connectRouter, RouterState } from 'connected-react-router';
import { combineReducers } from 'redux';

import { BotsState, botsReducer } from './bots';
import { MatchesState, matchesReducer } from './matches';
import { NotificationsState, notificationReducer } from './notifications';
import { MapsState, mapsReducer } from './maps';

import { NavbarState, navbarReducer } from './navbar';
import { LogsState, logsReducer } from './logs';
import { LobbyState, lobbyReducer, defaultLobbyState } from './lobby';

export interface GState {
  readonly router: RouterState;

  readonly bots: BotsState;
  readonly matches: MatchesState;
  readonly logs: LogsState;
  readonly notifications: NotificationsState;
  readonly maps: MapsState;
  readonly lobby: LobbyState;

  readonly navbar: NavbarState;
}

export const initialState: GState = {
  router: undefined as any,

  navbar: { notificationsVisible: false },
  bots: {},
  matches: {},
  logs: {},
  maps: {},
  lobby: defaultLobbyState,
  notifications: [],
};

export const createRootReducer = (history: History) => combineReducers<GState>({
  router: connectRouter(history),

  bots: botsReducer,
  matches: matchesReducer,
  logs: logsReducer,
  maps: mapsReducer,
  notifications: notificationReducer,
  lobby: lobbyReducer,

  navbar: navbarReducer,
});
