import * as React from 'react';
import { Component, SFC } from 'react';
import { div, h, li, span, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { IMatchMetaData, IMatchData } from '../../utils/GameModels';
import * as moment from 'moment';
import * as classnames from 'classnames';
import { MatchView } from './MatchView';


const styles = require('./Matches.scss');

// tslint:disable-next-line:interface-over-type-literal
type AnnotatedMatch = { id: number, match: IMatchMetaData };
type LogLoader = (paths: FileList) => void;

interface IMatchViewerProps {
  expandedGameId: number;
  matches: AnnotatedMatch[];
  loadLogs: LogLoader;
  importError: string;
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
    const { loadLogs, importError, matches } = this.props;
    // TODO: Error handling sucks, will get overridden on new problem;
    if (importError) { alert(importError); }
    if (matches.length === 0) { return h(NoMatches, { loadLogs }); }

    const selectedMatch = this.props.matches[this.state.selectedMatch].match;

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
  matches: AnnotatedMatch[],
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
  match: AnnotatedMatch,
  selected: boolean,
  onClick: () => void,
}

export const MatchListEntry: SFC<MatchEntryProps> = (props) => {
  const { stats, players } = props.match.match;
  // TODO: maybe compute this higher up
  let playerData = players.map((playerName, idx) => ({
    name: playerName,
    isWinner: idx == stats.winner - 1,
  }));

  let className = styles.matchListEntry;
  if (props.selected) {
    className = classnames(styles.selected, className);
  }

  return <div className={className} onClick={props.onClick}>
    <div className={styles.matchListEntryContent}>
      <PlayerList players={playerData}/>
      <MapName name="mycoolmap23"/>
    </div>
  </div>;
}

export const FaIcon: SFC<{icon: string}> = ({icon}) => 
  <i className={classnames('fa', 'fa-' + icon)} aria-hidden={true}/>;

interface PlayerProps {
  isWinner: boolean,
  name: string,
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
  return <div>
    <div className={styles.iconSpan}> {icon} </div>
    <span> {player.name} </span>
  </div>;
}

export const MapName: SFC<{name: string}> = ({name}) =>
  <div>
    <div className={styles.iconSpan}> <FaIcon icon='globe'/> </div>
    <span> {name} </span>
  </div>;



export class MatchDetails extends React.Component<{}, {}> {
  public render() {
    return div(`.${styles.matchDetailsPane}`, ['No details yet!']);
  }
}

// tslint:disable-next-line:variable-name
export const NoMatches: React.SFC<{ loadLogs: LogLoader }> = (props) => {
  return div(`.${styles.noMatches}`, [
    h(MatchImporter, props),
    p(['No matches played yet!']),
  ]);
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
