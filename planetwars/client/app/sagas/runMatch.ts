import { call, apply, take, takeEvery, put, fork } from 'redux-saga/effects';
import { eventChannel, Channel } from 'redux-saga';
import * as A from '../actions';
import { Address, PlayerData, ClientData } from '../reducers/lobby';
import { MatchRunner, MatchControl } from 'mozaic-client';
import { Config } from '../utils/Config';
import { generateToken } from '../utils/GameRunner';
import { ServerParams } from '../actions/lobby';
import { ActionWithPayload } from '../actions/helpers';
import { ISimpleEvent } from 'ste-simple-events';

export function* runMatchSaga() {
  while (true) {
    const { payload: serverParams} = yield take(A.startServer.type);
    const runner: MatchRunner = yield call(startServer, serverParams);
    yield fork(lobby, runner.matchControl);

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

function* lobby(match: MatchControl) {
  yield fork(watchConnectEvents, match);
  yield fork(watchDisconnectEvents, match);
  yield fork(watchCreatePlayer, match);
}

function* watchCreatePlayer(match: MatchControl) {
  yield takeEvery(A.createPlayer.type, registerPlayer, match);
}

function* watchConnectEvents(match: MatchControl) {
  const channel = simpleEventChannel(match.onPlayerConnected);
  yield takeEvery(channel, function*(clientId: number) {
    yield put(A.clientConnected({ clientId }));
  });
}

function* watchDisconnectEvents(match: MatchControl) {
  const channel = simpleEventChannel(match.onPlayerDisconnected);
  yield takeEvery(channel, function*(clientId: number) {
    yield put(A.clientDisconnected({ clientId }));
  });
}

function* registerPlayer(match: MatchControl, action: ActionWithPayload<PlayerData>) {
  const player = action.payload;
  const token = generateToken();

  const tokenBuf = Buffer.from(token, 'hex');
  const clientId = yield call([match, match.addPlayer], tokenBuf);

  yield put(A.clientRegistered({
    playerId: player.id,
    clientId,
    token,
  }));
}

function simpleEventChannel<T>(event: ISimpleEvent<T>): Channel<T> {
  return eventChannel((emit) => {
    event.subscribe(emit);
    const unsubscribe = () => event.unsubscribe(emit);
    return unsubscribe;
  });
}
