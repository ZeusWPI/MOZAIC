import { fork } from 'redux-saga/effects';

import { runMatchSaga } from './runMatch';
import { runClientSaga } from './clients';
import { runNotificationSaga } from './notifications';

/**
 * This root saga will finnish immediately, while it's 3 child saga's are kept
 * running.
 *
 * https://github.com/redux-saga/redux-saga/blob/master/docs/advanced/RootSaga.md
 */
export function* rootSaga() {
  console.log('Hello Sagas!');
  yield fork(runMatchSaga);
  yield fork(runClientSaga);
  yield fork(runNotificationSaga);
}
