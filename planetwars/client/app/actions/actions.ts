import { IBotConfig } from '../utils/ConfigModels';
import { IMatchMetaData } from '../utils/GameModels';

import { actionCreator, actionCreatorVoid } from './helpers';

export const toggleNavMenu = actionCreatorVoid('TOGGLE_NAV_MENU');
export const incrementAbout = actionCreatorVoid('TEST');
export const addBot = actionCreator<IBotConfig>('ADD_BOT');
export const addMatchMeta = actionCreator<IMatchMetaData>('ADD_MATCH_META');
export const matchImportError = actionCreator<string>('MATCH_IMPORT_ERROR');
export const importMatchMeta = actionCreator<IMatchMetaData>('IMPORT_MATCH_META');

export const dbError = actionCreator<any>('DB_ERROR');
export const dbSync = actionCreator<any>('DB_SYNC');
