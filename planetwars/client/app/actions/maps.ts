import * as M from '../database/models';
import { createAction } from 'typesafe-actions';

// Map
export const importMap = createAction('IMPORT_MAP', (resolve) => {
  return (meta: M.MapMeta) => resolve(meta);
});

// export const importMapError 
// export const importMapError = actionCreator<string>('IMPORT_MAP_ERROR');
