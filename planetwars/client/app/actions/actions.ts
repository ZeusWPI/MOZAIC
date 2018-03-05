import { actionCreatorVoid, actionCreator } from './helpers';
import { BotConfig } from '../utils/Models';

export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');
export const incrementAbout = actionCreatorVoid('TEST');
export const loadBot = actionCreator<BotConfig>('LOAD_BOT');