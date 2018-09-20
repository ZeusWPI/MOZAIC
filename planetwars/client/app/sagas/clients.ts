import * as A from '../actions';
import * as M from '../database/models';
import { Client, PwClient, Logger, Address, events } from 'mozaic-client';
import { Config } from '../utils/Config';
import { eventChannel } from 'redux-saga';
import { parseLogFile, calcStats } from '../lib/match';
import { createWriteStream, WriteStream } from "fs";
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
    try {
      yield call(joinMatch, action.payload);
    } catch (error) {
      alert(`An error occured:\n${error}`);
    }
  });
}

function* joinMatch(params: A.JoinMatchParams) {
  const logPath = Config.matchLogPath(params.matchId);
  const logger = new Logger(logPath);

  const client = yield call(runPwClient, {
    address: params.address,
    token: params.token,
    botId: params.botId,
    logger,
  });

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
      clientid: client.clientId,
      token: params.token,
      connected: true,
    },
  };

  yield put(A.createMatch(match));

  const eventChan = clientEventChannel(client);
  const event = yield take(eventChan);
  if (event === 'exit') {
    const log = yield call(parseLogFile, match.logPath, match.type);
    const stats = calcStats(log);
    yield put(A.matchFinished({
      matchId: match.uuid,
      stats,
    }));
  }
}

export interface ClientParams {
  clientId: number;
  matchUuid: Uint8Array;
  address: Address;
  token: string;
  logger: Logger;
  botId: M.BotId;
}

export function* runPwClient(params: ClientParams) {
  const bot = yield select((state: GState) => state.bots[params.botId]);
  const [command, ...args] = stringArgv(bot.command);
  const botConfig = { command, args };

  const pwClient = new PwClient({
    host: params.address.host,
    port: params.address.port,

    matchUuid: params.matchUuid,
    clientId: params.clientId,

    token: new Buffer(params.token, 'hex'),
    logger: params.logger,

    botConfig,
  });

  pwClient.run();
  return pwClient;
}

function clientEventChannel(client: Client) {
  return eventChannel((emit) => {
    const exitHandler = () => emit('exit');

    client.on(events.Disconnected, exitHandler);
    const unsubscribe = () => {
      client.on(events.Disconnected, () => {});
    };
    return unsubscribe;
  });
}
