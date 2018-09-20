import React from 'react';
import classNames from 'classnames/bind';
import { Visualizer } from 'planetwars-visualizer';
import BlocklyEditor from 'components/BlocklyEditor';
import styleIdentifiers from './app.scss';
import mainstyles from './main.scss';

const styles = classNames.bind(styleIdentifiers);

export default function App() {
  return (
    <div className={styles('app')}>
      <div id="blockly" className={styles('blockly')} />
      <BlocklyEditor />
      <button>Save code</button>
    </div>
  );
}
