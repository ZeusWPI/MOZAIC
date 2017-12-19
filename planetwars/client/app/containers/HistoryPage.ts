import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import History from "../components/History"

interface HistoryPageProps {

}

interface HistoryPageState {

}


export default class HistoryPage extends React.Component<HistoryPageProps, HistoryPageState> {
  render() {
    return (
      h(History)
    );
  }
}
