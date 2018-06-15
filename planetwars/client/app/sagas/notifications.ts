import * as A from '../actions';
import { takeEvery, put, fork } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

export function* runNotificationSaga() {
  yield fork(watchMatchFinished);
  yield fork(watchMatchError);
}

function* watchMatchFinished() {
  yield takeEvery(getType(A.matchFinished), function*(action: any) {
    const { matchId } = action.payload;
    const title = 'Match ended';
    const body = `A match has ended`;
    const link = `/matches/${matchId}`;
    yield put(A.addNotification({ title, body, link, type: 'Finished' }));
  });
}

function* watchMatchError() {
  yield takeEvery(getType(A.matchError), function*(action: any) {
    const { matchId } = action.payload;
    const title = 'Match errored';
    const body = `A match has errored`;
    const link = `/matches/${matchId}`;
    yield put(A.addNotification({ title, body, link, type: 'Error' }));
  });
}
