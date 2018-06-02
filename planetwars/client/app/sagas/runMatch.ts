import { call, take, put } from 'redux-saga/effects';
import * as A from '../actions';
import { Address } from '../reducers/lobby';
import { MatchRunner } from 'mozaic-client';
import { Config } from '../utils/Config';
import { generateToken } from '../utils/GameRunner';
import { ServerParams } from '../actions/lobby';

export function* runMatchSaga() {
  while (true) {
    const { payload: serverParams} = yield take(A.startServer.type);
    const runner: MatchRunner = yield call(startServer, serverParams);

    yield take(A.stopServer.type);
    runner.shutdown();
    yield put(A.serverStopped());
  }
}

function* startServer(params: ServerParams) {
  const runner = yield call(MatchRunner.create, Config.matchRunner, {
    address: params.address,
    ctrl_token: generateToken(),
    logFile: Config.matchLogPath(params.matchId),
  });
  yield put(A.serverStarted(params.matchId));
  return runner;
}
