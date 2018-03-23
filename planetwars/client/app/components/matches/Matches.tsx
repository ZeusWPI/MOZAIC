import * as React from 'react';
import { Component, SFC } from 'react';
import { div, h, li, span, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { Match } from '../../utils/GameModels';
import * as moment from 'moment';
import * as classnames from 'classnames';
import { MatchView } from './MatchView';


const styles = require('./Matches.scss');

// tslint:disable-next-line:interface-over-type-literal
type LogLoader = (paths: FileList) => void;

export interface IMatchViewerProps {
  matches: Match[];
}

interface IMatchViewerState {
  // use index as id, for now
  selectedMatch: number,
}

export default class MatchViewer extends Component<IMatchViewerProps, IMatchViewerState> {
  constructor(props: IMatchViewerProps) {
    super(props)
    this.state = { selectedMatch: 0 };
  }

  select(idx: number) {
    this.setState({ selectedMatch: idx });
  }

  public render() {
    const { matches } = this.props;
    if (matches.length === 0) { return <NoMatches />; }

    const selectedMatch = this.props.matches[this.state.selectedMatch];;

    return <div className={styles.matchViewer}>
      <MatchList
        matches={matches}
        selected={this.state.selectedMatch}
        selectFn={this.select.bind(this)}
      />
      <MatchView match={selectedMatch}/>
    </div>;
  }
}

interface MatchListProps {
  matches: Match[],
  selected: number,
  selectFn: (index: number) => void,
}

export const MatchList: SFC<MatchListProps> = (props) => {
  const listEntries = props.matches.map((match, idx) => {
    return <li>
      <MatchListEntry
        match={match}
        selected={idx == props.selected}
        onClick={() => props.selectFn(idx)}
      />
    </li>
  });

  return <ul className={styles.matchList}> {listEntries} </ul>;
}


interface MatchEntryProps {
  match: Match,
  selected: boolean,
  onClick: () => void,
}

export const MatchListEntry: SFC<MatchEntryProps> = (props) => {
  const { players } = props.match;
  // TODO: maybe compute this higher up
  let playerData = players.map((playerName, idx) => ({
    name: playerName,
    isWinner: false, // TODO
    score: 100,
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

  let className = styles.matchListEntry;
  if (props.selected) {
    className = classnames(styles.selected, className);
  }

  return <div className={className} onClick={props.onClick}>
    <div className={styles.matchListEntryContent}>
      <PlayerList players={playerData}/>
      <TimeLocation match={props.match}/>
    </div>
  </div>;
}

export const FaIcon: SFC<{icon: string}> = ({icon}) => 
  <i className={classnames('fa', 'fa-' + icon)} aria-hidden={true}/>;

interface PlayerProps {
  name: string,
  isWinner: boolean,
  score?: number,
}

export const PlayerList: SFC<{players: PlayerProps[]}> = ({players}) => {
  let entries = players.map((player) => 
    <li><PlayerEntry {...player}/></li>
  );
  return <ul className={styles.playerList}> {entries} </ul>;
}

export const PlayerEntry: SFC<PlayerProps> = (player) => {
  let icon = null;
  if (player.isWinner) {
    icon = <FaIcon icon='trophy'/>;
  }
  let scoreField = null;
  return <div className={styles.playerEntry}>
    <div className={styles.iconSpan}> {icon} </div>
    <div className={styles.playerName}> {player.name} </div>
    <PlayerScore player={player}/>
  </div>;
}

export const PlayerScore: SFC<{player: PlayerProps}> = ({ player }) => {
  if (!player.score) {
    return null;
  }
  return <div className={styles.playerScore}>
    <FaIcon icon='rocket'/>
    {player.score}
  </div>;
};


function dateOrHour(time: moment.Moment) {
  if (moment().startOf('day') < time) {
    return time.format("HH:mm");
  } else {
    return time.format("DD/MM");
  }
}

export const TimeLocation: SFC<{match: Match}> = ({match}) =>
  <div className={styles.mapNameWrapper}>
    <div className={styles.iconSpan}> <FaIcon icon='globe'/> </div>
    <span className={styles.mapName}> {"mijncoolemap23"} </span>
    <div className={styles.matchTime}> {dateOrHour(moment())} </div>
  </div>;


// tslint:disable-next-line:variable-name
export const NoMatches: React.SFC<{}> = (props) => {
  return <div className={styles.noMatches}>
    <p>
      No matches played yet!
    </p>
  </div>;
};

// TODO: Support loading multiple files
export class MatchImporter extends React.Component<{ loadLogs: LogLoader }> {
  private fileInput: FileList;

  public render() {
    return form(`.${styles.matchImporter}`,
      { onSubmit: (evt: any) => this.handleSubmit(evt) },
      [
        label(['Import Match(es)']),
        input({
          type: 'file',
          multiple: true,
          onChange: (evt: any) => this.handleChange(evt),
        }),
        button({ type: 'submit' }, ['Import']),
      ]
    );
  }

  private handleChange(evt: any): void {
    this.fileInput = evt.target.files;
  }

  private handleSubmit(event: any) {
    this.props.loadLogs(this.fileInput);
  }
}
