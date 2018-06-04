import * as A from '../actions';
import * as M from '../database/models';
import { Client, PwClient, Logger } from 'mozaic-client';
import { Config } from '../utils/Config';
import { eventChannel } from 'redux-saga';
import { parseLogFile, calcStats } from '../lib/match';
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
import { GState } from '../reducers';
import { ActionWithPayload } from '../actions/helpers';
// tslint:disable-next-line:no-var-requires
const stringArgv = require('string-argv');

// TODO: remove duplication
// TODO: handle errors

export function* runClientSaga() {
  yield takeEvery(A.joinMatch.type, function*(action: any) {
    yield call(joinMatch, action.payload);
  });
}

function* joinMatch(params: A.JoinMatchParams) {
  const logPath = Config.matchLogPath(params.matchId);

  const client: Client = yield call(Client.connect, {
    host: params.address.host,
    port: params.address.port,
    token: new Buffer(params.token, 'hex'),
    logger: new Logger(logPath),
  });
  const eventChan = clientEventChannel(client);

  const match: M.JoinedMatch = {
    uuid: params.matchId,
    type: M.MatchType.joined,
    status: M.MatchStatus.playing,
    timestamp: new Date(),
    network: params.address,
    logPath,
    bot: {
      type: M.BotSlotType.internal,
      botId: params.botId,
      name: params.name,
      number: client.clientId,
      token: params.token,
      connected: true,
    },
  };

  const bot = yield select((state: GState) => state.bots[params.botId]);
  const [command, ...args] = stringArgv(bot.command);
  const botConfig = { command, args };

  const pwClient = new PwClient(client, botConfig);
  yield put(A.saveMatch(match));

  const event = yield take(eventChan);
  if (event === 'exit') {
    const log = parseLogFile(match.logPath, match.type);
    const updatedMatch: M.FinishedMatch = {
      ...match,
      stats: calcStats(log),
      status: M.MatchStatus.finished,
    };
    yield put(A.saveMatch(updatedMatch));
  }
}

function clientEventChannel(client: Client) {
  return eventChannel((emit) => {
    const exitHandler = () => emit('exit');

    client.onExit.subscribe(exitHandler);
    const unsubscribe = () => {
      client.onExit.unsubscribe(exitHandler);
    };
    return unsubscribe;
  });
}
