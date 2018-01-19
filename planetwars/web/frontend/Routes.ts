import * as React from 'react';
import { Switch, Route } from 'react-router';
import { h, ul, li } from 'react-hyperscript-helpers';

import App from './App';
import Home from './components/Home';
import Downloads from './components/Downloads';
import Rankings from './components/Rankings';
import Signup from './components/Signup';

export default () => (
  h(App, [
    h(Switch, [
      h(Route, {
        path: '/',
        component: Home,
        exact: true
      }),
      h(Route, {
        path: '/downloads',
        component: Downloads
      }),
      h(Route, {
        path: '/rankings',
        component: Rankings
      }),
      h(Route, {
        path: '/signup',
        component: Signup
      })
    ])
  ])
);
