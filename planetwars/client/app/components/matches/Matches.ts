import * as React from 'react';
import { div, h, li, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { IMatchMetaData } from '../../utils/GameModels';

const styles = require('./Matches.scss');

// tslint:disable-next-line:interface-over-type-literal
type AnnotatedMatch = { id: number, match: IMatchMetaData };
type LogLoader = (paths: FileList) => void;

interface IMatchesProps {
  expandedGameId: number;
  matches: AnnotatedMatch[];
  loadLogs: LogLoader;
  importError: string;
}

interface IState { }

export default class Matches extends React.Component<IMatchesProps, IState> {
  public render() {
    const { loadLogs, importError, matches } = this.props;
    // TODO: Error handling sucks, will get overridden on new problem;
    if (importError) { alert(importError); }
    if (matches.length === 0) { return h(NoMatches, { loadLogs }); }

    return div(`.${styles.matchesPage}`, [
      h(MatchImporter, { loadLogs }),
      div(`.${styles.matchesOverview}`, [
        h(MatchesList, { matches }),
        h(MatchDetails, {}),
      ]),
    ]);
  }
}

export class MatchesList extends React.Component<{ matches: AnnotatedMatch[] }> {
  public render() {
    const matches = this.props.matches.map((match) =>
      li(`.${styles.matchesListItem}`, [
        h(MatchEntry, { match }),
      ]),
    );
    return ul(`.${styles.matchesListPane}`, matches);
  }
}

interface IMatchEntryProps {
  match: AnnotatedMatch;
}

// tslint:disable-next-line:variable-name
export const MatchEntry: React.SFC<IMatchEntryProps> = (props) => {
  const { stats, players } = props.match.match;
  const winnerName = players[stats.winner - 1] || "Tie";
  return div(`.${styles.match}`, [
    `Winner: ${winnerName} | ${stats.turns} turns`,
  ]);
};

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
