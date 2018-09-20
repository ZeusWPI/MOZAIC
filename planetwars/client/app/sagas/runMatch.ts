import { eventChannel, Channel } from 'redux-saga';
import * as A from '../actions';
import { Address, PlayerData, ClientData, PwConfig, LobbyState } from '../reducers/lobby';
import { Config } from '../utils/Config';
import { generateToken } from '../utils/GameRunner';
import { ServerParams, RunLocalBot } from '../actions/lobby';
import { ActionWithPayload } from '../actions/helpers';
import { ISimpleEvent } from 'ste-simple-events';
import * as M from '../database/models';
import { GState } from '../reducers';
import { parseLogFile, calcStats } from '../lib/match';
import { createWriteStream, WriteStream } from 'fs';
import {
  ServerRunner,
  PwMatch,
  PwClient,
  ServerControl,
  events as PwEvents,
  Logger,
} from 'mozaic-client';


import {
  apply,
  call,
  take,
  takeEvery,
  put,
  fork,
  select,
  cancel,
  race,
  spawn,
} from 'redux-saga/effects';
import { runPwClient, ClientParams } from './clients';
import { Connected } from '../../../../client/dist/eventTypes';

// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

export function* runMatchSaga() {
  while (true) {
    try {
      yield lobbyFlowSaga();
    } catch (error) {
      alert(`An error occured:\n${error}`);
    }
  }
}

function* lobbyFlowSaga() {
  // start the server
  const { payload: serverParams} = yield take(A.startServer.type);

  const runner: MatchRunner = yield call(matchRunner, serverParams);
  yield put(A.serverStarted(serverParams.matchId));
  console.log('started');

  // start the lobby
  const lobbyTask = yield fork(runLobby, runner);

  // run lobby until either the server is being shutdown, or the match
  // is being started
  const { stop, run } = yield race({
    stop: take(A.stopServer.type),
    run: take(A.startMatch.type),
  });
  yield cancel(lobbyTask);

  if (stop) {
    // stop server and exit
    runner.serverRunner.killServer();
    yield put(A.serverStopped());
  }
  if (run) {
    // run match in background
    const match = yield call(assembleMatch, serverParams.matchId, run.payload);
    yield spawn(runMatch, runner, match);
    yield put(A.resetLobby());
  }
}

function* runLobby(runner: MatchRunner) {
  yield fork(watchConnectEvents, runner.matchControl);
  yield fork(watchDisconnectEvents, runner.matchControl);
  yield fork(watchCreatePlayer, runner.matchControl);
  yield fork(watchRunLocalBot, runner);
}

function* watchCreatePlayer(match: PwMatch) {
  yield takeEvery(A.createPlayer.type, registerPlayer, match);
}

function* watchConnectEvents(match: PwMatch) {
  const channel = simpleEventChannel(match.on(PwEvents.ClientConnected));
  yield takeEvery(channel, function*({ clientId }) {
    yield put(A.clientConnected({ clientId }));
  });
}

function* watchDisconnectEvents(match: PwMatch) {
  const channel = simpleEventChannel(match.on(PwEvents.ClientDisconnected));
  yield takeEvery(channel, function*({ clientId}) {
    yield put(A.clientDisconnected({ clientId }));
  });
}

function* watchRunLocalBot(runner: MatchRunner) {
  function* runLocalBot(action: ActionWithPayload<RunLocalBot>) {
    const { clientId, bot } = action.payload;

    const client: ClientData = yield select(
      (state: GState) => state.lobby.clients[clientId]
    );
    // TODO
    const params: ClientParams = {
      clientId,
      matchUuid: runner.matchUuid,
      token: client.token,
      address: runner.serverRunner.address,
      logger: runner.logger,
      botId: bot.uuid,
    };
    yield call(runPwClient, params);
  }
  yield takeEvery(A.runLocalBot.type, runLocalBot);
}

function* registerPlayer(match: PwMatch, action: ActionWithPayload<PlayerData>) {
  const player = action.payload;
  const token = generateToken();

  const tokenBuf = Buffer.from(token, 'hex');
  const { clientId } = yield call([match, match.createClient], tokenBuf);

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

function matchEventChannel(runner: MatchRunner) {
  return eventChannel((emit) => {
    const onFinished = runner.matchControl.on(PwEvents.GameFinished);
    // TODO: how to get errors? this is not really the ideal way
    const onError = runner.serverRunner.onError;

    const completeHandler = () => emit('complete');
    const errorHandler = (err: Error) => emit(err);

    onFinished.subscribe(completeHandler);
    onError.subscribe(errorHandler);

    const unsubscribe = () => {
      onFinished.unsubscribe(completeHandler);
      onError.unsubscribe(errorHandler);
    };

    return unsubscribe;
  });
}

function* runMatch(runner: MatchRunner, match: M.PlayingHostedMatch) {
  const mapPath = yield select((state: GState) => state.maps[match.map].mapPath);
  const matchChan = matchEventChannel(runner);

  yield call(
    [runner.matchControl, runner.matchControl.send],
    PwEvents.StartGame.create({
      mapPath,
      maxTurns: match.maxTurns,
    })
  );
  yield put(A.createMatch(match));

  const event = yield take(matchChan);
  if (event === 'complete') {
    const log = parseLogFile(match.logPath, match.type);
    const stats = calcStats(log);
    yield put(A.matchFinished({
      matchId: match.uuid,
      stats,
    }));
  } else {
    const error = event.message;
    yield put(A.matchError({
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
        clientid: client.clientId,
      };
      return slot;
    } else {
      const slot: M.ExternalBotSlot = {
        type: M.BotSlotType.external,
        name: player.name,
        token: client.token,
        connected: client.connected,
        clientid: client.clientId,
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

// quickly hack this together as a temporary solution
interface MatchRunner {
  serverRunner: ServerRunner;
  serverControl: ServerControl;
  matchControl: PwMatch;
  matchUuid: Uint8Array;
  logger: Logger;
}

function matchRunner(serverParams: ServerParams): Promise<MatchRunner> {
  return new Promise((resolve, reject) => {
    const ctrlToken = generateToken();
    const matchToken = generateToken();

    const logPath =  Config.matchLogPath(serverParams.matchId);
    const logger = new Logger(logPath);

    // SET UP SERVER RUNNER

    const serverRunner = new ServerRunner(Config.matchRunner, {
      address: serverParams.address,
      ctrl_token: ctrlToken,
      logFile: logPath,
    });

    // SET UP SERVER CONTROL
    const serverControl = new ServerControl({
      ...serverParams.address,
      token: Buffer.from(ctrlToken, 'hex'),
    });

    serverControl.on(PwEvents.Connected, (_) => {
      serverControl.createMatch(Buffer.from(matchToken, 'hex')).then((e) => {
        const matchUuid = e.matchUuid;

        const matchControl = new PwMatch({
          ...serverParams.address,
          token: Buffer.from(matchToken, 'hex'),
          matchUuid,
          logger,
        });

        matchControl.client.on(Connected, (_) => {
          resolve({
            serverRunner,
            serverControl,
            matchControl,
            logger,
            matchUuid,
          });
        });

        matchControl.connect();
      });
    });

    // RUN THE ENTIRE THING

    serverRunner.runServer();
    // wait 150 ms to be sure that the server is listening
    setTimeout(() => { serverControl.connect(); }, 150);
  });
}
