import * as React from 'react';
import * as fs from 'fs';

import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

let styles = require("./BotsConfig.scss");

interface BotsConfigProps {
  botName: string,
  rerender: Function
}

interface BotsConfigState {
  loadedName?: string,
  name: string,
  cmd: string,
  args: string[],
  errors: string[]
}

export default class BotsConfig extends React.Component<BotsConfigProps, BotsConfigState> {
  constructor(props:BotsConfigProps) {
    super(props);
    this.updateState();
  }
  render() {
    if(this.props.botName != this.state.loadedName) {
      this.updateState();
    }
    return (
      h("form", {
        onSubmit: () => this.saveBot(),
      }, [
        "Name: ", h("input", `.${styles.nameField}`, { type: "text", value: this.state.name, onChange: (x:any) => this.setState({ name: x.target.value })}),
        "Command: ", h("input", `.${styles.cmdField}`, { type: "text", value: this.state.cmd, onChange: (x:any) => this.setState({ cmd: x.target.value })}),
        "Arguments: ", h(ArgumentFields, {
          args: this.state.args,
          addArg: () => this.addArg(),
          removeArg: (x:number) => this.removeArg(x),
          handleChange: (value:string, num:number) => this.handleArgumentChange(value, num)
        }),
        h("input", '.button', { type:"submit", value: "Save"}),
        h("ul", `.${styles.errorList}`, this.state.errors.map(
          (error:string, key:number) =>
            h("li", `.${styles.errorItem}`, { key: key }, [error])
        ))
        ])
      );
    }
  setDefaultState() {
        this.setState({ loadedName: this.props.botName, name:"", cmd:"", args: [""], errors: [] })
  }
  saveBot() {
    if(!this.checkValid()){
      return;
    }
    let path = `./bots/${ this.state.name }.json`
    if(!fs.existsSync("./bots")) {
      fs.mkdirSync("./bots");
    }
    if (!fs.existsSync(path) || confirm(`Bot ${ this.state.name } already exists, are you sure you want to overwrite it?`) ) {
      fs.writeFileSync(path, JSON.stringify(
        {
          name: this.state.name,
          command: this.state.cmd,
          args: this.state.args
        }
      ));
    }
    this.props.rerender();
  }
  checkValid(){
    let errors = []
    if(!this.state.name) {
      errors.push("Name cannot be empty");
    }
    if(!this.state.cmd) {
      errors.push("Command cannot be empty");
    }
    if(this.state.args.indexOf("") != -1) {
      errors.push("Please remove empty arguments");
    }
    this.setState({ errors: errors });
    if(errors.length == 0) {
      return true;
    } else {
      return false;
    }
  }
  addArg() {
    let args = this.state.args;
    args.push("");
    this.setState({ args: args })
  }
  removeArg(i:number) {
    let args = this.state.args;
    args.splice(i,1);
    this.setState({ args: args })
  }
  updateState() {
    let path = `./bots/${ this.props.botName }.json`
    if (fs.existsSync(path)) {
      var botData = JSON.parse(fs.readFileSync(path, 'utf8'));
      this.state = {
        loadedName: botData.name,
        name: botData.name,
        cmd: botData.command,
        args: botData.args,
        errors: this.state.errors
      }
    } else {
      this.state = {
        name: "",
        cmd: "",
        args: [""],
        errors: []
      }
    }
  }
  handleArgumentChange(value:string, num:number) {
    let args = this.state.args;
    args[num] = value;
    this.setState({ args: args })
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
        this.props.args.map((arg:string, num:number) => h("div", { key: num },[h(ArgumentField, {
          arg:arg,
          handleChange: (value:string) => this.props.handleChange(value, num)
        }),
        h("button", '.button', { onClick: () => this.props.removeArg(num) }, ["-"])
      ])),
      h("button", '.button', { onClick: () => this.props.addArg() }, ["+"])
    ]);
  }
}

// Useful for debugging...
function abc(x:any) {
  console.log(x);
  return x;
}

interface ArgumentFieldProps {
  arg: string,
  handleChange: Function
}

interface ArgumentFieldState {

}

export class ArgumentField extends React.Component<ArgumentFieldProps, ArgumentFieldState> {
  render() {
    return h("input", `.${styles.argField}`, { type:"text", value: this.props.arg, onChange: (x:any) => this.props.handleChange(x.target.value) })
  }
}
