import { actionCreatorVoid, actionCreator } from './helpers';
import { BotConfig } from '../utils/Models';

export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');
export const incrementAbout = actionCreatorVoid('TEST');
export const loadBot = actionCreator<BotConfig>('LOAD_BOT');
export const matchStarted = actionCreatorVoid('MATCH_STARTED');
export const matchFinished = actionCreatorVoid('MATCH_FINISHED');
export const matchCrashed = actionCreator<any>('MATCH_CHRASHED');
