import { call, apply, take, takeEvery, put, fork, select, cancel } from 'redux-saga/effects';
import { eventChannel, Channel } from 'redux-saga';
import * as A from '../actions';
import { Address, PlayerData, ClientData, PwConfig } from '../reducers/lobby';
import { MatchRunner, MatchControl, Logger, Client, PwClient } from 'mozaic-client';
import { Config } from '../utils/Config';
import { generateToken } from '../utils/GameRunner';
import { ServerParams, BotParams } from '../actions/lobby';
import { ActionWithPayload } from '../actions/helpers';
import { ISimpleEvent } from 'ste-simple-events';
import { GState } from '../reducers';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');


export function* runMatchSaga() {
  while (true) {
    const { payload: serverParams} = yield take(A.startServer.type);
    const runner: MatchRunner = yield call(startServer, serverParams);
    yield fork(runMatch, runner);
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

function* runMatch(runner: MatchRunner) {
  const lobbyTask = yield fork(lobby, runner);
  const action = yield take(A.startMatch.type);
  yield cancel(lobbyTask);

  yield startMatch(runner.matchControl, action.payload);
}

function* lobby(runner: MatchRunner) {
  yield fork(watchConnectEvents, runner.matchControl);
  yield fork(watchDisconnectEvents, runner.matchControl);
  yield fork(watchCreatePlayer, runner.matchControl);
  yield fork(watchRunLocalBot, runner.logger);
}

function* startMatch(control: MatchControl, conf: PwConfig) {
  const { mapId, maxTurns } = conf;
  const mapPath = yield select((state: GState) => state.maps[mapId].mapPath);
  yield call([control, control.startGame], {
    map_file: mapPath,
    max_turns: maxTurns,
  });
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

function* watchRunLocalBot(logger: Logger) {
  function* runLocalBot(action: ActionWithPayload<BotParams>) {
    const { address, token, bot } = action.payload;
    const [command, ...args] = stringArgv(bot.command);
    const botConfig = { command, args };

    const client = yield call(Client.connect, {
      host: address.host,
      port: address.port,
      token: new Buffer(token, 'hex'),
      logger,
    });
    const pwClient = new PwClient(client, botConfig);
  }
  yield takeEvery(A.runLocalBot.type, runLocalBot);
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
