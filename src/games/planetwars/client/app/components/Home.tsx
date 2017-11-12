import * as React from 'react';

import { Visualizer } from 'planetwars-visualizer';

// let styles = require('./Home.scss');

export default class Home extends React.Component {
  render() {
    // TODO: The visualizer should of course not be the only component here,
    // we need things like a navbar, config editing, etc...
    // We should make a container with a default layout.
    // Could be the HomePage (this), but probably better something different.
    return <Visualizer />
  }
}
