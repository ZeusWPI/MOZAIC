import React from 'react';
import classNames from 'classnames/bind';
import styleIdentifiers from './app.scss';
import mainstyles from './main.scss';

const styles = classNames.bind(styleIdentifiers);

export default function App() {
  return (
    <div className={styles('app')}>
      <div id="blockly" className={styles('blockly')} />
    </div>
  );
}
