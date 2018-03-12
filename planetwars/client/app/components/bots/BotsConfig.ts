import * as React from 'react';
import * as Promise from 'bluebird';
import * as fs from 'fs';

import {RouteComponentProps} from 'react-router';
import {h} from 'react-hyperscript-helpers';
import {Config} from '../../utils/Config';
import {IBotConfig} from "../../utils/ConfigModels";

let styles = require("./BotsConfig.scss");

interface BotsConfigProps {
  botName: string,
  loadedBot: IBotConfig | null,
  refreshBots: Function,
  saveBot: (bot: IBotConfig) => Promise<{}>
}

interface BotsConfigState {
  loadedName?: string,
  name: string,
  cmd: string,
  args: string[],
  errors: string[]
}

//TODO: convert to show details of loadedbot, write savebot function, figure out formstate-control

export default class BotsConfig extends React.Component<any, BotsConfigState> {
  constructor(props: BotsConfigProps) {
    super(props);
    this.props.refreshBots();
  }

  componentWillMount() {
    this.setState({name: "", cmd: "", args: [""], errors: []});
  }

  componentWillReceiveProps(nextProps: BotsConfigProps) {

    if (nextProps.loadedBot) {
      this.setState({
        name: nextProps.loadedBot.name,
        cmd: nextProps.loadedBot.command,
        args: nextProps.loadedBot.args,
        errors: []
      })
    } else {
      this.setState({name: "", cmd: "", args: [""], errors: []})
    }
  }


  render() {


    return (
      h("form", {
        onSubmit: (evt: any) => {
          evt.preventDefault();
          return this.props.saveBot({
            name: this.state.name,
            command: this.state.cmd,
            args: this.state.args
          })

        },
      }, [
        "Name: ",
        h("input", `.${styles.nameField}`,
          {
            type: "text", value: this.state.name,
            onChange: (x: any) => this.setState({name: x.target.value})
          }),

        "Command: ",
        h("input", `.${styles.cmdField}`,
          {
            type: "text", value: this.state.cmd,
            onChange: (x: any) => this.setState({cmd: x.target.value})
          }),

        "Arguments: ",
        h(ArgumentFields, {
          args: this.state.args,
          addArg: () => this.addArg(),
          removeArg: (x: number) => this.removeArg(x),
          handleChange: (value: string, num: number) => this.handleArgumentChange(value, num)
        }),

        h("input", '.button', {type: "submit", value: "Save"}),

        h("ul", `.${styles.errorList}`, this.state.errors.map(
          (error: string, key: number) =>
            h("li", `.${styles.errorItem}`, {key: key}, [error])
        ))
      ])
    );
  }

//   setDefaultState() {
//     this.setState({ loadedName: this.props.botName, name: "", cmd: "", args: [""], errors: [] })
//   }
//   saveBot() {
//     if (!this.checkValid()) {
//       return;
//     }
//     let path = Config.botPath(this.state.name);
//     if (!fs.existsSync(Config.bots)) {
//       fs.mkdirSync(Config.bots);
//     }
//     if (!fs.existsSync(path) || confirm(`Bot ${this.state.name} already exists, are you sure you want to overwrite it?`)) {
//       fs.writeFileSync(path, JSON.stringify(
//         {
//           name: this.state.name,
//           command: this.state.cmd,
//           args: this.state.args
//         }
//       ));
//     }
//     this.props.refreshBots();
//   }

  // checkValid() {
  //   let errors = []
  //   if (!this.state.name) {
  //     errors.push("Name cannot be empty");
  //   }
  //   if (!this.state.cmd) {
  //     errors.push("Command cannot be empty");
  //   }
  //   if (this.state.args.indexOf("") != -1) {
  //     errors.push("Please remove empty arguments");
  //   }
  //   this.setState({errors: errors});
  //   if (errors.length == 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  addArg() {
    let args = this.state.args;
    args.push("");
    this.setState({args: args})
  }

  removeArg(i: number) {
    let args = this.state.args;
    args.splice(i, 1);
    this.setState({args: args})
  }

  // updateState() {
  //   let path = Config.botPath(this.props.botName);
  //   if (fs.existsSync(path)) {
  //     var botData = JSON.parse(fs.readFileSync(path, 'utf8'));
  //     this.state = {
  //       loadedName: botData.name,
  //       name: botData.name,
  //       cmd: botData.command,
  //       args: botData.args,
  //       errors: this.state.errors
  //     }
  //   } else {
  //     this.state = {
  //       name: "",
  //       cmd: "",
  //       args: [""],
  //       errors: []
  //     }
  //   }
  // }

  handleArgumentChange(value: string, num: number) {
    let args = this.state.args;
    args[num] = value;
    this.setState({args: args})
  }
}

export interface ArgumentFieldsProps {
  args: string[],
  addArg: Function,
  removeArg: Function,
  handleChange: Function
}

interface ArgumentFieldsState {

}

export class ArgumentFields extends React.Component<ArgumentFieldsProps, ArgumentFieldsState> {
  render() {
    return h("div", [
      this.props.args.map((arg: string, num: number) => h("div", {key: num}, [h(ArgumentField, {
        arg: arg,
        handleChange: (value: string) => this.props.handleChange(value, num)
      }),
        h("button", '.button', {onClick: () => this.props.removeArg(num)}, ["-"])
      ])),
      h("button", '.button', {onClick: () => this.props.addArg()}, ["+"])
    ]);
  }
}

interface ArgumentFieldProps {
  arg: string,
  handleChange: Function
}

interface ArgumentFieldState {

}

export class ArgumentField extends React.Component<ArgumentFieldProps, ArgumentFieldState> {
  render() {
    return h("input", `.${styles.argField}`, {
      type: "text",
      value: this.props.arg,
      onChange: (x: any) => this.props.handleChange(x.target.value)
    })
  }
}
