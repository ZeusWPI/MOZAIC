import { MatchStats } from '../../utils/database/models';

export interface MatchProps {
  uuid: string;
  players: Player[];
  map: Map;
  timestamp: Date;
  logPath: string;
}

export interface Player {
  uuid: string;
  name: string;
}

export interface Map {
  uuid: string;
  name: string;
}

export type PlayingMatch = MatchProps & {
  status: 'playing',
};

export type FinishedMatch = MatchProps & {
  status: 'finished',
  stats: MatchStats,
};

export type ErroredMatch = MatchProps & {
  status: 'error',
  error: string,
};

export type Match = PlayingMatch | FinishedMatch | ErroredMatch;
