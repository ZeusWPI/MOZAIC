import * as React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from "react-router-dom"
import { h, ul, li } from 'react-hyperscript-helpers';

import App from './App';
import Home from './Home';

export default () => (
  h(App, [
    h(Switch, [
      h(Route, {
        path: '/',
        component: Home
      })
    ])
  ])
);
