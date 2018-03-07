import * as React from 'react';

import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";

let styles = require("./BotsList.scss");

interface BotElementProps {
  name: string
  removeBot: Function
}

export default class BotElement extends React.Component<BotElementProps> {
  constructor(props: BotElementProps) {
    super(props);
  }

  render() {
    return h(Link, `.${styles.botsentry}`, {to: `/bots/${this.props.name}`}, [
      h("li", `.${styles.botlistitem}`, [
        this.props.name,
        h("button", `.${styles.removebot}`, {onClick: (evt:any) => this.props.removeBot(this.props.name, evt)}, ["x"])
      ])
    ])
  }

}