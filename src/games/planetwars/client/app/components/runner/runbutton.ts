import * as React from 'react';

const execFile = require('child_process').execFile;
const h = require('react-hyperscript');
const fs = require('fs');

export interface RunbuttonProps {
  gamesetter: Function,
  configFilePath: string
}

interface RunbuttonState {
  value: string,
  gamelog?: string
}

export class Runbutton extends React.Component<RunbuttonProps, RunbuttonState> {
  constructor(props:RunbuttonProps) {
    super(props);
    this.state = {
      value: "Click here to start"
    };
  }
  render() {
    return h("button", {
        className: "runbutton",
        onClick: () => this.setState({value: this.runBotRunner()})
      }, [this.state.value]
    );
  }
  runBotRunner() {
    // This path is kinda hardcoded
    const child = execFile("./../../../botdriver/target/debug/mozaic_bot_driver.exe", [this.props.configFilePath], ((error:any, stdout:any, stderr:any) => {
        if (error) {
            console.error(error);
            console.log("Botrunner returned: ", stdout);
            console.error(stderr);
            this.setState({value: "Error, see console for details"});
        } else {
            fs.readFile("./gamelog.json", "utf-8", (err:string, data:string) =>  { this.setState({value: "Done executing", gamelog: data}); this.props.gamesetter(data) });
        }

    }));
    return "Loading..."
  }
}
