import {
  JsonGameState,
  Player,
  Planet,
  PlanetList,
  Expedition,
  JsonPlanet,
  JsonExpedition,
  JsonCommand,
} from '../types';
import { connect } from 'net';

export class MatchLog {
  public players: Player[];
  public gameStates: GameState[];
  public playerInputs: PlayerInputs[];

  constructor(players: Player[]) {
    this.players = players;
    this.gameStates = [];
    this.playerInputs = [];
  }

  public getWinners(): Set<Player> {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
  }

  public addGameState(gameState: GameState) {
    Object.keys(gameState.planets).forEach((planetName) => {
      const planet = gameState.planets[planetName];
      if (planet.owner) {
        planet.owner.score += 1;
      }
    });
    this.gameStates.push(gameState);
    this.playerInputs.push({});
  }

  public setInput(player: Player, content: string) {
    const playerInputs = this.playerInputs[this.playerInputs.length - 1];
    playerInputs[player.uuid] = {
      raw: content,
      commands: [],
    };
  }

  public inputError(player: Player, error: string) {
    const playerInputs = this.playerInputs[this.playerInputs.length - 1];
    playerInputs[player.uuid].error = error;
  }

  public addCommand(player: Player, command: Command) {
    const playerInputs = this.playerInputs[this.playerInputs.length - 1];
    playerInputs[player.uuid].commands.push(command);
  }
}

export class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];

  constructor(planets: PlanetList, expeditions: Expedition[]) {
    this.planets = planets;
    this.expeditions = expeditions;
  }

  public livingPlayers(): Set<Player> {
    const livingPlayers = new Set();
    Object.keys(this.planets).forEach((planetName) => {
      const planet = this.planets[planetName];
      if (planet.owner) {
        livingPlayers.add(planet.owner);
      }
    });
    this.expeditions.forEach((expedition) => {
      livingPlayers.add(expedition.owner);
    });
    return livingPlayers;
  }
}

export interface PlayerInputs {
  [playerId: string]: PlayerInput;
}

export interface PlayerInput {
  raw: string;
  error?: string;
  commands: Command[];
}

interface Command {
  command: JsonCommand;
  error?: string;
}

export default MatchLog;
