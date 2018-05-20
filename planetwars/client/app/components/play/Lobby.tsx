import * as React from 'react';

import Section from './Section';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export default class Lobby extends React.Component {
  public render() {
    return (
      <Section header={"Lobby"}>
        <ul>
          <li>
            <p>test</p>
          </li>
          <li>
            <p>test</p>
          </li>
          <li>
            <p>test</p>
          </li>
        </ul>
      </Section>
    );
  }
}