import { IBotConfig } from '../utils/ConfigModels';
import { actionCreator, actionCreatorVoid } from './helpers';

export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');
export const incrementAbout = actionCreatorVoid('TEST');
export const loadBot = actionCreator<IBotConfig>('LOAD_BOT');
