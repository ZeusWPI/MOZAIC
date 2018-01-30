import * as React from 'react';
import { Switch, Route } from 'react-router';
import { h, ul, li } from 'react-hyperscript-helpers';

import App from './App';
import Home from './components/Home';
import Info from './components/Info';
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
        path: '/info',
        component: Info
      }),
      h(Route, {
        path: '/signup',
        component: Signup
      })
    ])
  ])
);
