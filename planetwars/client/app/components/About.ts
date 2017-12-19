import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

interface AboutProps {

}

interface AboutState {

}

export default class About extends React.Component<AboutProps, AboutState>{
  render() {
    return h("div", ["Here be About page"])
  }
}
