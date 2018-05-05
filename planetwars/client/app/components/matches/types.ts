import { MatchStats, MatchStatus, MatchType } from '../../utils/database/models';

export interface Player {
  number: number;
  name: string;
}

export interface Map {
  uuid: string;
  name: string;
}

export type Match = HostedMatch | JoinedMatch;
export type HostedMatch = PlayingHostedMatch | FinishedHostedMatch | ErroredHostedMatch;
export type JoinedMatch = PlayingJoinedMatch | FinishedJoinedMatch | ErroredJoinedMatch;

export interface MatchProps {
  uuid: string;
  players: Player[];
  timestamp: Date;
}

export type HostedMatchProps = MatchProps & {
  type: MatchType.hosted;
  map: Map;
  logPath: string;
};

export type PlayingHostedMatch = HostedMatchProps & {
  status: MatchStatus.playing,
};

export type FinishedHostedMatch = HostedMatchProps & {
  status: MatchStatus.finished,
  stats: MatchStats,
};

export type ErroredHostedMatch = HostedMatchProps & {
  status: MatchStatus.error,
  error: string,
};

export type JoinedMatchProps = MatchProps & {
  type: MatchType.joined;
};

export type PlayingJoinedMatch = JoinedMatchProps & {
  status: MatchStatus.playing;
};

export type FinishedJoinedMatch = JoinedMatchProps & {
  status: MatchStatus.finished;
  importedLog?: { logPath: string; stats: MatchStats; playerNames: string[] };
};
export type ErroredJoinedMatch = JoinedMatchProps & {
  status: MatchStatus.error,
  importedLog?: { logPath: string; },
};
