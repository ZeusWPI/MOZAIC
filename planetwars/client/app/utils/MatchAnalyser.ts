import { ILogFormat, IMatchStats, IExpedition } from './GameModels';

export class MatchAnalyser {

  public static analyseSync(match: ILogFormat): IMatchStats {
    const { players, turns } = match;

    // The commands send in an object with id as property-name
    // and in an array with id as index
    // tslint:disable-next-line:interface-over-type-literal
    type CommandMap = { [key: string]: IExpedition };
    const commandMap: CommandMap = turns.reduce((coms, turn) => {
      turn.expeditions.forEach((exp) => {
        if (!coms[exp.id]) {
          coms[exp.id] = exp;
        }
      });
      return coms;
    }, <CommandMap> {});
    const commands: IExpedition[] = Object.keys(commandMap).map((k) => commandMap[k]);
    // Amount of commands each player ordered
    const commandsOrdered: number[] = new Array(players.length + 1).fill(0);
    commands.forEach((exp) => { commandsOrdered[exp.owner] += 1; });

    // Amount of ships each player send
    const shipsSend: number[] = new Array(players.length + 1).fill(0);
    commands.forEach((exp) => { shipsSend[exp.owner] += exp.ship_count; });

    // Amount of times a planet has been flipped
    const planetsFlipped = turns.slice(1).reduce((flipped, turn, i) => {
      const owners = turn.planets.map((p) => p.owner);
      const previous = turns[i];
      const pOwners = previous.planets.map((p) => p.owner);
      const flippedNow = turn.planets.reduce((_flipped, p, ii) => {
        return (pOwners[ii] !== owners[ii])
          ? _flipped + 1
          : _flipped;
      }, 0);
      return flipped + flippedNow;
    }, 0);

    // Winner
    const lastTurn = turns[turns.length - 1];
    const remainingPlayers = new Set();
    lastTurn.planets.forEach((p) => {
      if (p.owner) {
        remainingPlayers.add(p.owner);
      }
    });
    lastTurn.expeditions.forEach((e) => { remainingPlayers.add(e.owner); });
    const winner: number = (remainingPlayers.size === 1)
      ? remainingPlayers.values().next().value
      : undefined;

    return { winner, shipsSend, commandsOrdered, planetsFlipped, turns: turns.length };
  }
}
