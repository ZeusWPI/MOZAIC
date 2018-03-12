import * as React from 'react';
import * as Promise from 'bluebird'

import {h} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";
import BotsPage from "../../containers/BotsPage";
import {BotsState} from "../../reducers";

let styles = require("./BotsList.scss");

interface BotElementProps {
  name: string
  removeBot: () => Promise<void>
}

export default class BotElement extends React.Component<any, BotsState> {
  constructor(props: BotElementProps) {
    super(props);
  }

  render() {
    return h(Link, `.${styles.botsentry}`, {to: `/bots/${this.props.name}`}, [
      h("li", `.${styles.botlistitem}`, [
        this.props.name,
        h("button", `.${styles.removebot}`, {
          onClick: (evt: any) => {
            this.props.removeBot(this.props.name, evt);
          }
        }, ["x"])
      ])
    ])
  }

}