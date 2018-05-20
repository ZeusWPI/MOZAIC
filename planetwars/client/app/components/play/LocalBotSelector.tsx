import * as React from 'react';

import * as M from '../../database/models';
import Section from './Section';

// tslint:disable-next-line:no-var-requires
const styles = require('./PlayPage.scss');

export interface LocalBotSelectorProps {
  bots: M.BotList;
}

export class LocalBotSelector extends React.Component {
  public render() {
    return (
      <Section header={"Local Bots"}>
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
