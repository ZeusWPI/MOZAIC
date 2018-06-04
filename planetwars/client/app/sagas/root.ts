import { fork } from 'redux-saga/effects';
import { runMatchSaga } from './runMatch';
import { runClientSaga } from './clients';

export function* rootSaga() {
  console.log('Hello Sagas!');
  yield fork(runMatchSaga);
  yield fork(runClientSaga);
}
