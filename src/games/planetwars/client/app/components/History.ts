import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

interface HistoryProps {

}

interface HistoryState {

}

export default class History extends React.Component<HistoryProps, HistoryState>{
  render() {
    return h("div", ["Here be History page"])
  }
}
