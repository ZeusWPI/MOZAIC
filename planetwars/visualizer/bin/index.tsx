import * as React from 'react';
import { render } from 'react-dom';
import { LogManager } from './LogManager'

import './main.global.scss';

render(
    <LogManager />,
    document.getElementById('root')
);
