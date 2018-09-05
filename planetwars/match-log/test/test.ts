import * as fs from 'fs';

import * as M from '../src';

const HOSTED_SMALL = "./examples/hosted_small.log";
const HOSTED_FULL = "./examples/hosted_full.log";

test('can read full hosted match from disk without crashing', () => {
  const log = parseLogFile(HOSTED_FULL, M.MatchType.hosted);
  expect(log).toBeTruthy();
});

test('can read unfinished hosted match from disk without crashing', () => {
  const log = parseLogFile(HOSTED_SMALL, M.MatchType.hosted);
  expect(log).toBeTruthy();
});

describe('small log contains correct', () => {
  let log: M.MatchLog;

  beforeAll(() => {
    log = parseLogFile(HOSTED_SMALL, M.MatchType.hosted);
  });

  test('winners', () => {
    expect(log.getWinners()).toEqual(new Set([1, 2]));
  });

  test('number of gamestates', () => {
    expect(log.gameStates.length).toBe(6);
  });
});

export function parseLogFile(path: string, type: M.MatchType): M.MatchLog {
  const content = fs.readFileSync(path, 'utf-8');
  return M.parseLog(content, type);
}