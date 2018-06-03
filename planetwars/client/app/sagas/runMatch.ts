import { call, apply, take, takeEvery, put, fork } from 'redux-saga/effects';
import * as A from '../actions';
import { Address, PlayerData, ClientData } from '../reducers/lobby';
import { MatchRunner, MatchControl } from 'mozaic-client';
import { Config } from '../utils/Config';
import { generateToken } from '../utils/GameRunner';
import { ServerParams } from '../actions/lobby';
import { ActionWithPayload } from '../actions/helpers';

export function* runMatchSaga() {
  while (true) {
    const { payload: serverParams} = yield take(A.startServer.type);
    const runner: MatchRunner = yield call(startServer, serverParams);
    const match: Match = {
      control: runner.matchControl,
      players: {},
    };

    yield fork(lobby, match);

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

function* lobby(match: Match) {
  yield fork(watchCreatePlayer, match);
}

function* watchCreatePlayer(match: Match) {
  yield takeEvery(A.createPlayer.type, registerPlayer, match);
}

function* registerPlayer(match: Match, action: ActionWithPayload<PlayerData>) {
  const player = action.payload;
  const token = generateToken();

  match.players[player.id] = { token };
  const tokenBuf = Buffer.from(token, 'hex');
  const clientId = yield call([match.control, 'addPlayer'], tokenBuf);
  match.players[player.id].clientId = clientId;
  yield put(A.clientRegistered({
    playerId: player.id,
    clientId,
    token,
  }));
}

interface Match {
  control: MatchControl;
  players: { [playerId: string]: PlayerClientData };
}

interface PlayerClientData {
  clientId?: number;
  token: string;
}
