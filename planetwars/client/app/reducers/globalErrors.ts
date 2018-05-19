import * as A from '../actions';

export function globalErrorReducer(state: any[] = [], action: any) {
  if (A.dbError.test(action)) {
    return [...state, action.payload];
  }
  if (A.importMapError.test(action)) {
    return [...state, action.payload];
  }
  return state;
}
