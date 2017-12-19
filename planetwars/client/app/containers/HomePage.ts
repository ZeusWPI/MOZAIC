import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Home from "../components/Home"

interface HomePageProps {

}

interface HomePageState {

}

export default class HomePage extends React.Component<HomePageProps, HomePageState> {
  render() {
    return (
      h(Home)
    );
  }
}
