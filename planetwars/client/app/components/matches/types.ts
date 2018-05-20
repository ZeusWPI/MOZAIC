import { MatchStats, MatchStatus, MatchType } from '../../database/models';
import { Log } from '../../reducers/logs';

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

export type FinishedMatch = FinishedHostedMatch | FinishedJoinedMatch;

export interface MatchProps {
  uuid: string;
  players: Player[];
  timestamp: Date;
  log?: Log;
  logPath: string;
}

export interface FinishedMatchProps {
  status: MatchStatus.finished;
  stats: MatchStats;
}

export type FinishedHostedMatch = HostedMatchProps & FinishedMatchProps;
export type FinishedJoinedMatch = JoinedMatchProps & FinishedMatchProps;

export interface ErroredMatchProps {
  status: MatchStatus.error;
  error: string;
}

export type ErroredHostedMatch = HostedMatchProps & ErroredMatchProps;
export type ErroredJoinedMatch = JoinedMatchProps & ErroredMatchProps;

export type HostedMatchProps = MatchProps & {
  type: MatchType.hosted;
  map: Map;
};

export type PlayingHostedMatch = HostedMatchProps & {
  status: MatchStatus.playing;
};

export type JoinedMatchProps = MatchProps & {
  type: MatchType.joined;
};

export type PlayingJoinedMatch = JoinedMatchProps & {
  status: MatchStatus.playing;
};
