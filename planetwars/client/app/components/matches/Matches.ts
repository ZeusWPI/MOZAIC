import * as React from 'react';
import { Component } from 'react';
import { div, h, li, span, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { IMatchMetaData } from '../../utils/GameModels';
import * as moment from 'moment';

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

export default class MatchViewer extends React.Component<IMatchesProps, IState> {
  public render() {
    const { loadLogs, importError, matches } = this.props;
    // TODO: Error handling sucks, will get overridden on new problem;
    if (importError) { alert(importError); }
    if (matches.length === 0) { return h(NoMatches, { loadLogs }); }

    return div({ className: styles.matchViewer }, [
      h(MatchList, { matches }),
      div("placeholder")
    ]);
  }
}

interface IMatchListProps {
  matches: AnnotatedMatch[],
}

interface IMatchListState {
  selected: number,
}

export class MatchList extends Component<IMatchListProps, IMatchListState> {
  public render() {
    const matches = this.props.matches.map((match) =>
      li({ className: styles.matchlistEntry }, [
        h(MatchListEntry, { match }),
      ]),
    );
    return ul(`.${styles.matchList}`, matches);
  }
}

interface IMatchEntryProps {
  match: AnnotatedMatch;
}

// tslint:disable-next-line:variable-name
export class MatchListEntry extends Component<IMatchEntryProps> {
  render() {
    const { stats, players } = this.props.match.match;
    return div(`.${styles.matchListEntry}`, [
      div({ className: styles.content }, [
        ul({ className: styles.playerList }, players.map((p, idx) => {
          let className;
          if (stats.winner == idx + 1) {
            className = styles.winner;
          } else {
            className = styles.loser;
          }
          return li({ className }, p);
        }))
      ])
    ]);
  }
}

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
