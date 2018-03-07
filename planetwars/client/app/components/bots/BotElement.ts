import * as React from 'react';

import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";

let styles = require("./BotsConfig");

interface BotElementProps {
  name: string
  handleClick: Function
}

export default class BotElement extends React.Component<BotElementProps> {
  constructor(props: BotElementProps) {
    super(props);
  }

  render() {
    return h(Link, `.${styles.botsentry}`, {to: `/bots/${this.props.name}`}, [
      h("li", `.${styles.botlistitem}`, [
        this.props.name,
        h("button", `.${styles.removebot}`, {onClick: this.props.handleClick}, ["x"])
      ])
    ])
  }

}