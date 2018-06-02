import { fork } from 'redux-saga/effects';
import { runMatchSaga } from './runMatch';

export function* rootSaga() {
  console.log('Hello Sagas!');
  yield fork(runMatchSaga);
}
