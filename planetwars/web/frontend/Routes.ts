import * as React from 'react';
import { Switch, Route } from 'react-router';
import { h, ul, li } from 'react-hyperscript-helpers';

import App from './App';
import Home from './components/Home';
import Info from './components/Info';
import Signup from './components/Signup';
import Code from './components/Code';
import Play from './components/Play';
import Win from './components/Win';
import Introduction from './components/Introduction';

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
      }),
      h(Route, {
        path: '/code',
        component: Code
      }),
      h(Route, {
        path: '/win',
        component: Win
      }),
      h(Route, {
        path: '/play',
        component: Play
      }),
      h(Route, {
        path: '/26-03',
        component: Introduction
      })
    ])
  ])
);
