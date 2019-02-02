import { takeEvery, put, fork } from 'redux-saga/effects';

import * as A from '../actions';

export function* runNotificationSaga() {
  yield fork(watchMatchFinished);
  yield fork(watchMatchError);
}

function* watchMatchFinished() {
  yield takeEvery(A.matchFinished.type, function* (action: any) {
    const { matchId } = action.payload;
    const title = 'Match ended';
    const body = `A match has ended`;
    const link = `/matches/${matchId}`;
    yield put(A.addNotification({ title, body, link, type: 'Finished' }));
  });
}

function* watchMatchError() {
  yield takeEvery(A.matchError.type, function* (action: any) {
    const { matchId } = action.payload;
    const title = 'Match errorred';
    const body = `A match has errorred`;
    const link = `/matches/${matchId}`;
    yield put(A.addNotification({ title, body, link, type: 'Error' }));
  });
}
