import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../database/models';

// Bots
export const addBot = actionCreator<{ name: string, command: string }>('ADD_BOT');
export const editBot = actionCreator<M.Bot>('EDIT_BOT');
export const removeBot = actionCreator<M.BotId>('REMOVE_BOT');