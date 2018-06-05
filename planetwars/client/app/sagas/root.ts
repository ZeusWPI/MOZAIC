import { fork } from 'redux-saga/effects';
import { runMatchSaga } from './runMatch';
import { runClientSaga } from './clients';
import { runNotificationSaga } from './notifications';

export function* rootSaga() {
  console.log('Hello Sagas!');
  yield fork(runMatchSaga);
  yield fork(runClientSaga);
  yield fork(runNotificationSaga);
}
