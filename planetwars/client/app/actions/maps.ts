import { actionCreator, actionCreatorVoid } from './helpers';
import * as M from '../database/models';

// Map
export const importMap = actionCreator<M.MapMeta>('IMPORT_MAP');
export const importMapError = actionCreator<string>('IMPORT_MAP_ERROR');
