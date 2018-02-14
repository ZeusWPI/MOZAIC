import * as React from 'react';
import { h } from 'react-hyperscript-helpers';

let styles = require("./App.scss");

export default class App extends React.Component {
  render() {
    return (
      h("div", `.${styles.app}`, [this.props.children])
    );
  }
}
