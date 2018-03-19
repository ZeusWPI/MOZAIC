import * as React from 'react';
import { div, h, li, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { IMatchMetaData, MatchId, IMatchList } from '../../utils/GameModels';

// tslint:disable-next-line:no-var-requires
const styles = require('./Matches.scss');

type LogLoader = (paths: FileList) => void;

export interface IMatchesStateProps {
  expandedGameId?: MatchId;
  matches: IMatchList;
  importError?: string;
}

export interface IMatchesFuncProps {
  loadLogs: LogLoader;
}

type IMatchesProps = IMatchesStateProps & IMatchesFuncProps;

export default class Matches extends React.Component<IMatchesProps, {}> {
  public render() {
    const { loadLogs, importError, matches } = this.props;
    // TODO: Error handling sucks, will get overridden on new problem;
    if (importError) { alert(importError); }
    if (Object.keys(matches).length === 0) { return h(NoMatches, { loadLogs }); }

    return div(`.${styles.matchesPage}`, [
      h(MatchImporter, { loadLogs }),
      div(`.${styles.matchesOverview}`, [
        h(MatchesList, { matches }),
        h(MatchDetails, {}),
      ]),
    ]);
  }
}

export class MatchesList extends React.Component<{ matches: IMatchList }> {
  public render() {
    const matches = Object.keys(this.props.matches).map((uuid) =>
      li(`.${styles.matchesListItem}`, [
        h(MatchEntry, { match: this.props.matches[uuid] }),
      ]),
    );
    return ul(`.${styles.matchesListPane}`, matches);
  }
}

interface IMatchEntryProps {
  match: IMatchMetaData;
}

// tslint:disable-next-line:variable-name
export const MatchEntry: React.SFC<IMatchEntryProps> = (props) => {
  const { stats, players } = props.match;
  const winnerName = players[stats.winner - 1] || "Tie";
  return div(`.${styles.match}`, [
    p([`Winner: ${winnerName}`]),
    p([`Players: ${players}`]),
    p([`${stats.turns} turns`]),
    p([`${stats.planetsFlipped} planets flipped`]),
    p([`${stats.commandsOrdered} commands ordered`]),
    p([`${stats.shipsSend} ships send`]),
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
      ],
    );
  }

  private handleChange(evt: any): void {
    this.fileInput = evt.target.files;
  }

  private handleSubmit(event: any) {
    this.props.loadLogs(this.fileInput);
  }
}
