import * as M from '../src';

const HOSTED_SMALL = "./examples/hosted-small.log";
const HOSTED_FULL = "./examples/hosted-full.log";

test('can read full hosted match from disk without crashing', () => {
  const log = M.parseLogFile(HOSTED_FULL, M.MatchType.hosted);
  expect(log).toBeTruthy();
});

test('can read unfinished hosted match from disk without crashing', () => {
  const log = M.parseLogFile(HOSTED_SMALL, M.MatchType.hosted);
  expect(log).toBeTruthy();
});

describe('small log contains correct', () => {
  let log: M.MatchLog;

  beforeAll(() => {
    log = M.parseLogFile(HOSTED_SMALL, M.MatchType.hosted);
  });

  test('winners', () => {
    expect(log.getWinners()).toEqual(new Set([1, 2]));
  });

  test('number of gamestates', () => {
    expect(log.gameStates.length).toBe(6);
  });
});