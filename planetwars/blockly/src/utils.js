const { MatchLog } = require('./MatchLog');

export async function uploadBot(code, name) {
  const data = {
    code,
    name,
  };

  await fetch('http://localhost:3000/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  });
}

export async function callServerMatch(code, name, opponent) {
  const data = {
    code,
    name,
  };

  if (opponent) {
    data.opponent = opponent;
  }

  const response = await fetch('http://localhost:3000/bot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  });

  const gameData = await response.json();

  return gameData;
}

export async function getOpponents() {
  const response = await fetch('http://localhost:3000/players');
  const data = await response.json();
  return data.players;
}

export async function runMatch(code, name, opponent) {
  const gameData = await callServerMatch(code, name, opponent);

  const gameLog = new MatchLog();

  gameLog.setGameStates(gameData.gameStates);
  gameLog.setPlayerLogs(gameData.playerLogs);

  return gameLog;
}
