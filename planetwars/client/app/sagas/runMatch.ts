import { eventChannel, Channel } from 'redux-saga';
import { ISimpleEvent } from 'ste-simple-events';
import { fs } from 'mz';
import {
  call,
  apply,
  take,
  takeEvery,
  put,
  fork,
  select,
  cancel,
  race,
  spawn,
} from 'redux-saga/effects';

import { parseLog, calcStats } from 'planetwars-match-log';
import { MatchRunner, Logger } from 'mozaic-client';

import * as ALobby from '../actions/lobby';
import * as AMatch from '../actions/matches';
import * as M from '../database/models';
import * as U from '../utils';

import { GState } from '../reducers';
import { PlayerData, PwConfig, LobbyState } from '../reducers/lobby';
import { Config } from '../utils/Config';
import { ServerParams, BotParams } from '../actions/lobby';
import { ActionWithPayload } from '../actions/helpers';

import { runPwClient } from './clients';

/**
 * Saga for everything related to match running, this is mainly controlling the
 * actions created from the lobby: server starting, match assembling,
 * match running, watching for connected clients, etc...
 */
export function* runMatchSaga() {
  while (true) {
    try {
      yield lobbyFlowSaga();
    } catch (error) {
      alert(`An error occurred:\n${error}`);
    }
  }
}

function* lobbyFlowSaga() {
  // start the server
  const { payload: serverParams } = yield take(ALobby.startServer.type);
  const runner: MatchRunner = yield call(startServer, serverParams);

  // start the lobby
  const lobbyTask = yield fork(runLobby, runner);

  // run lobby until either the server is being shutdown, or the match
  // is being started
  const { stop, run } = yield race({
    stop: take(ALobby.stopServer.type),
    run: take(ALobby.startMatch.type),
  });
  yield cancel(lobbyTask);

  if (stop) {
    // stop server and exit
    runner.shutdown();
    yield put(ALobby.serverStopped());
  }
  if (run) {
    // run match in background
    const match = yield call(assembleMatch, serverParams.matchId, run.payload);
    yield spawn(runMatch, runner, match);
    yield put(ALobby.resetLobby());
  }
}

function* startServer(params: ServerParams) {
  const runner = yield call(MatchRunner.create, Config.matchRunner, {
    address: params.address,
    ctrl_token: U.generateToken(),
    logFile: Config.matchLogPath(params.matchId),
  });
  yield put(ALobby.serverStarted(params.matchId));
  return runner;
}

function* runLobby(runner: MatchRunner) {
  yield fork(watchConnectEvents, runner);
  yield fork(watchDisconnectEvents, runner);
  yield fork(watchCreatePlayer, runner);
  yield fork(watchRunLocalBot, runner.logger);
}

function* watchCreatePlayer(runner: MatchRunner) {
  yield takeEvery(ALobby.createPlayer.type, registerPlayer, runner);
}

function* watchConnectEvents(runner: MatchRunner) {
  const channel = simpleEventChannel(runner.onPlayerConnected);
  yield takeEvery(channel, function* (clientId: number) {
    yield put(ALobby.clientConnected({ clientId }));
  });
}

function* watchDisconnectEvents(runner: MatchRunner) {
  const channel = simpleEventChannel(runner.onPlayerDisconnected);
  yield takeEvery(channel, function* (clientId: number) {
    yield put(ALobby.clientDisconnected({ clientId }));
  });
}

function* watchRunLocalBot(logger: Logger) {
  function* runLocalBot(action: ActionWithPayload<BotParams>) {
    const { address, token, bot } = action.payload;
    yield call(runPwClient, {
      address,
      token,
      logger,
      botId: bot.uuid,
    });
  }
  yield takeEvery(ALobby.runLocalBot.type, runLocalBot);
}

function* registerPlayer(runner: MatchRunner, action: ActionWithPayload<PlayerData>) {
  const player = action.payload;
  const token = U.generateToken();

  const tokenBuf = Buffer.from(token, 'hex');
  const clientId = yield call([runner, runner.matchControl.addPlayer], tokenBuf);

  yield put(ALobby.clientRegistered({
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

function matchEventChannel(runner: MatchRunner) {
  return eventChannel((emit) => {
    const completeHandler = () => emit('complete');
    const errorHandler = (err: Error) => emit(err);

    runner.onComplete.subscribe(completeHandler);
    runner.onError.subscribe(errorHandler);

    const unsubscribe = () => {
      runner.onComplete.unsubscribe(completeHandler);
      runner.onError.unsubscribe(errorHandler);
    };

    return unsubscribe;
  });
}

function* runMatch(runner: MatchRunner, match: M.PlayingHostedMatch) {
  const mapPath = yield select((state: GState) => state.maps[match.map].mapPath);
  const matchChan = matchEventChannel(runner);

  yield call([runner, runner.matchControl.startGame], {
    map_file: mapPath,
    max_turns: match.maxTurns,
  });
  yield put(AMatch.createMatch(match));

  const event = yield take(matchChan);
  if (event === 'complete') {
    const logContents = fs.readFileSync(match.logPath).toString();
    const log = parseLog(logContents, match.type);
    const stats = calcStats(log);
    yield put(AMatch.matchFinished({
      matchId: match.uuid,
      stats,
    }));
  } else {
    const error = event.message;
    yield put(AMatch.matchError({
      matchId: match.uuid,
      error,
    }));
  }
}

function* assembleMatch(matchId: string, conf: PwConfig) {
  const lobby: LobbyState = yield select((state: GState) => state.lobby);
  const players = Object.keys(lobby.players).map((playerId) => {
    const player = lobby.players[playerId];
    // just force client id for now
    const client = lobby.clients[player.clientId!];
    if (player.botId) {
      const slot: M.InternalBotSlot = {
        type: M.BotSlotType.internal,
        name: player.name,
        token: client.token,
        connected: client.connected,
        botId: player.botId,
      };
      return slot;
    } else {
      const slot: M.ExternalBotSlot = {
        type: M.BotSlotType.external,
        name: player.name,
        token: client.token,
        connected: client.connected,
      };
      return slot;
    }
  });

  const match: M.HostedMatch = {
    uuid: matchId,
    type: M.MatchType.hosted,
    status: M.MatchStatus.playing,
    maxTurns: conf.maxTurns,
    map: conf.mapId,
    timestamp: new Date(),
    logPath: Config.matchLogPath(matchId),
    network: lobby.address,
    players,
  };

  return match;
}
