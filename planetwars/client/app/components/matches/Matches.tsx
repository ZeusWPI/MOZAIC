import * as React from 'react';
import { Component, SFC } from 'react';
import * as moment from 'moment';
import * as classnames from 'classnames';
import { Match, Player, Map } from './types';
import { MatchView } from './MatchView';

const styles = require('./Matches.scss');

export interface MatchViewerProps {
  matches: Match[];
}

interface MatchViewerState {
  // use index as id, for now
  selectedMatch: number;
}

export default class MatchViewer extends Component<MatchViewerProps, MatchViewerState> {
  constructor(props: MatchViewerProps) {
    super(props)
    this.state = { selectedMatch: 0 };
  }


  public render() {
    const { matches } = this.props;
    if (matches.length === 0) { return <NoMatches />; }

    const selectedMatch = this.props.matches[this.state.selectedMatch];
    const selectFn = (idx: number) => this.select(idx);
    return (
      <div className={styles.matchViewer}>
        <MatchList
          matches={matches}
          selected={this.state.selectedMatch}
          selectFn={selectFn}
        />
        <MatchView match={selectedMatch} />
      </div>);
  }

  private select(idx: number) {
    this.setState({ selectedMatch: idx });
  }

}

interface MatchListProps {
  matches: Match[];
  selected: number;
  selectFn: (index: number) => void;
}

export const MatchList: SFC<MatchListProps> = (props) => {
  const listEntries = props.matches.map((match, idx) => {
    const onClick = () => props.selectFn(idx);
    return (
      <li key={match.uuid}>
        <MatchListEntry
          key={match.uuid}
          match={match}
          selected={idx === props.selected}
          onClick={onClick}
        />
      </li>);
  });

  return <ul className={styles.matchList}> {listEntries} </ul>;
}

function calcPlayerData(match: Match): PlayerProps[] {
  if (match.status === 'finished') {
    return match.players.map((player) => ({
      uuid: player.uuid,
      name: player.name,
      isWinner: match.stats.winners.some((id) => id === player.uuid),
      score: match.stats.score[player.uuid],
    })).sort((a, b) => {
      // sort major on isWinner, minor on score
      if (a.isWinner && !b.isWinner) {
        return 0;
      }
      if (b.isWinner && !a.isWinner) {
        return 1;
      }
      return b.score - a.score;
    });
  } else {
    return match.players.map((player) => ({
      uuid: player.uuid,
      name: player.name,
      isWinner: false,
    }));
  }
}

interface MatchEntryProps {
  match: Match;
  selected: boolean;
  onClick: () => void;
}

export const MatchListEntry: SFC<MatchEntryProps> = (props) => {
  let className = styles.matchListEntry;
  if (props.selected) {
    className = classnames(styles.selected, className);
  }

  const playerData = calcPlayerData(props.match);

  return (
    <div className={className} onClick={props.onClick}>
      <div className={styles.matchListEntryContent}>
        <PlayerList players={playerData} />
        <TimeLocation match={props.match} />
        <MatchStatus match={props.match} />
      </div>
    </div>
  );
}

export const FaIcon: SFC<{ icon: string }> = ({ icon }) =>
  <i className={classnames('fa', 'fa-' + icon)} aria-hidden={true} />;

interface PlayerProps {
  uuid: string,
  name: string,
  isWinner: boolean,
  score?: number,
}

export const PlayerList: SFC<{ players: PlayerProps[] }> = ({ players }) => {
  const entries = players.map((player) =>
    <PlayerEntry key={player.uuid} player={player} />
  );
  return <ul className={styles.playerList}> {entries} </ul>;
}

export const PlayerEntry: SFC<{ player: PlayerProps }> = ({ player }) => {
  let icon = null;
  if (player.isWinner) {
    icon = <FaIcon icon='trophy' />;
  }
  return (
    <li className={styles.playerEntry}>
      <div className={styles.iconSpan}> {icon} </div>
      <div className={styles.playerName}> {player.name} </div>
      <PlayerScore player={player} />
    </li>
  );
}

export const PlayerScore: SFC<{ player: PlayerProps }> = ({ player }) => {
  if (!player.score) {
    return null;
  }
  return (
    <div className={styles.playerScore} title='score'>
      <FaIcon icon='rocket' />
      {player.score}
    </div>
  );
};


function dateOrHour(date: Date) {
  let time = moment(date);
  if (moment().startOf('day') < time) {
    return time.format("HH:mm");
  } else {
    return time.format("DD/MM");
  }
}

export const TimeLocation: SFC<{ match: Match }> = ({ match }) =>
  <div className={styles.timeLocation}>

    <div className={styles.mapName} title='map'>
      <div className={styles.iconSpan}>
        <FaIcon icon='globe' />
      </div>
      {match.map.name}
    </div>

    <div className={styles.matchTime} title='date'>
      {dateOrHour(match.timestamp)}
    </div>
  </div>;

export const MatchStatus: SFC<{ match: Match }> = ({ match }) => {
  switch (match.status) {
    case 'finished': {
      return null;
    }
    case 'playing': {
      return <div className={styles.matchStatus}>
        <div className={styles.iconSpan}>
          <FaIcon icon='play' />
        </div>
        in progress
      </div>;
    }
    case 'error': {
      return <div className={styles.matchStatus}>
        <div className={styles.iconSpan}>
          <FaIcon icon='exclamation-triangle' />
        </div>
        failed
      </div>;
    }
  }
}


// tslint:disable-next-line:variable-name
export const NoMatches: React.SFC<{}> = (props) => {
  return <div className={styles.noMatches}>
    <p>
      No matches played yet!
    </p>
  </div>;
};
