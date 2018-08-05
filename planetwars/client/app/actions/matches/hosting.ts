import * as PwClient from 'mozaic-client';

import { actionCreator, actionCreatorVoid } from '../helpers';
import * as M from '../../database/models';

// Host
export const setupServer = actionCreator<M.ServerParams>('SETUP_SERVER');
export const changeBotSlot = actionCreator<M.BotSlot>('CHANGE_BOT_SLOT');
export const selectMap = actionCreator<string>('SELECT_MAP');
export const playerConnected = actionCreator<M.Token>('PLAYER_CONNECT');
export const playerDisconnected = actionCreator<M.Token>('PLAYER_DISCONNECT');
export const serverStarted = actionCreator<PwClient.MatchReactor>('SERVER_STARTED');
