import * as React from 'react';
import { h } from "react-hyperscript-helpers"

let styles = require("./Bots.scss");

interface BotsProps {

}

interface BotsState {

}

export default class Bots extends React.Component<BotsProps, BotsState> {
  constructor(props:BotsProps) {
    super(props);
  }
  render() {
    // TODO: Load bots from machine
    let bots = ["Testbot", "Testbot2"]

    return h("div", [
      h("table", bots.map((botName:string) => h("tr", [botName, h("button", ["remove"]), h("button", ["edit"])].map((x:any) => h("td", [x]))))),
      h("button", ["Add new bot"])
    ]);
  }
}
