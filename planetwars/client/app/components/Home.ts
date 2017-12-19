import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

interface HomeProps {

}

interface HomeState {

}

export default class Home extends React.Component<HomeProps, HomeState>{
  render() {
    return h("div", ["Here be Home page"])
  }
}
