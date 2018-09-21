// This is a patched version that only uses as much as the blockly client needs

export class GameState {
  constructor(planets, expeditions) {
    this.planets = planets;
    this.expeditions = expeditions;
  }

  livingPlayers() {
    const livingPlayers = new Set();
    Object.keys(this.planets).forEach(planetName => {
      const planet = this.planets[planetName];
      if (planet.owner) {
        livingPlayers.add(planet.owner);
      }
    });
    this.expeditions.forEach(expedition => {
      livingPlayers.add(expedition.owner);
    });
    return livingPlayers;
  }
}


export class PlayerLog {
  constructor() {
    this.turns = [];
  }

  setTurns(turns) {
    this.turns = turns;
  }
}

export class MatchLog {
  constructor() {
    this.gameStates = [];
    this.playerLogs = {};
  }

  setGameStates(gameStates) {
    this.gameStates = gameStates.map(state => new GameState(state.planets, state.expeditions));
  }

  setPlayerLogs(playerLogs) {
    this.playerLogs = Object.keys(playerLogs).map(player => {
      const playerLog = new PlayerLog();

      playerLog.setTurns(playerLogs[player].turns);

      return playerLog;
    });
  }

  getPlayers() {
    return Array.from(this.gameStates[0].livingPlayers());
  }

  getWinners() {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
  }

  getPlayerLog(playerNum) {
    let playerLog = this.playerLogs[playerNum];
    if (!playerLog) {
      playerLog = new PlayerLog();
      this.playerLogs[playerNum] = playerLog;
    }
    return playerLog;
  }

  // This may be a hack...
  addPlayer(clientId) {
    this.getPlayerLog(clientId);
  }
}

export default MatchLog;
