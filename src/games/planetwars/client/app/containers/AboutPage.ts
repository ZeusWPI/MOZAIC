import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import About from "../components/About"

interface AboutPageProps {

}

interface AboutPageState {

}


export default class AboutPage extends React.Component<AboutPageProps, AboutPageState> {
  render() {
    return (
      h(About)
    );
  }
}
