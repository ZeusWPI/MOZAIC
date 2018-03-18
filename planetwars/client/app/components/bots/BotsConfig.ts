import * as React from 'react';
import * as Promise from 'bluebird';
import * as fs from 'fs';

import { RouteComponentProps } from 'react-router';
import { h, form, input, ul, li, div, button } from 'react-hyperscript-helpers';
import { Config } from '../../utils/Config';
import { IBotConfig, IBotData } from "../../utils/ConfigModels";

// tslint:disable-next-line:no-var-requires
const styles = require("./Bots.scss");

interface IBotsConfigProps {
  selectedBot?: IBotData;
  addBot: (bot: IBotConfig) => void;
  editBot: (bot: IBotData) => void;
}

interface IBotsConfigState {
  loadedName?: string;
  name: string;
  cmd: string;
  args: string[];
  errors: string[];
}

export class BotsConfig extends React.Component<IBotsConfigProps, IBotsConfigState> {

  public componentWillMount() {
    this.setState({ name: "", cmd: "", args: [""], errors: [] });
  }

  public render() {
    return (
      form(`.${styles.botsConfig}`,
        {
          onSubmit: (evt: any) => {
            console.log("test");
            // TODO: Use editbot if possible
            return this.props.addBot({
              name: this.state.name,
              command: this.state.cmd,
              args: this.state.args,
            });
          },
        },
        [
          "Name: ",
          input(`.${styles.nameField}`,
            {
              type: "text", value: this.state.name,
              onChange: (x: any) => this.setState({ name: x.target.value }),
            }),

          "Command: ",
          input(`.${styles.cmdField}`,
            {
              type: "text", value: this.state.cmd,
              onChange: (x: any) => this.setState({ cmd: x.target.value }),
            }),

          "Arguments: ",
          h(ArgumentFields, {
            args: this.state.args,
            addArg: () => this.addArg(),
            removeArg: (x: number) => this.removeArg(x),
            handleChange: (value: string, num: number) => this.handleArgumentChange(value, num),
          }),

          input('.button', { type: "submit", value: "Save" }),

          ul(`.${styles.errorList}`, this.state.errors.map(
            (error: string, key: number) =>
              li(`.${styles.errorItem}`, { key }, [error]),
          )),
        ])
    );
  }

  private addArg() {
    const args = this.state.args;
    args.push("");
    this.setState({ args });
  }

  private removeArg(i: number) {
    const args = this.state.args;
    args.splice(i, 1);
    this.setState({ args });
  }

  private handleArgumentChange(value: string, num: number) {
    const args = this.state.args;
    args[num] = value;
    this.setState({ args });
  }
}

export interface IArgumentFieldsProps {
  args: string[];
  addArg: Function;
  removeArg: Function;
  handleChange: Function;
}

interface IArgumentFieldsState { }

export class ArgumentFields extends React.Component<IArgumentFieldsProps, IArgumentFieldsState> {

  public render() {
    return div([
      this.props.args.map((arg: string, num: number) => div({ key: num }, [
        h(ArgumentField, {
          arg,
          handleChange: (value: string) => this.props.handleChange(value, num),
        }),
        button('.button', { type: 'button', onClick: () => this.props.removeArg(num) }, ["-"]),
      ])),
      button('.button', { type: 'button', onClick: () => this.props.addArg() }, ["+"]),
    ]);
  }
}

interface IArgumentFieldProps {
  arg: string;
  handleChange: Function;
}

interface IArgumentFieldState { }

export class ArgumentField extends React.Component<IArgumentFieldProps, IArgumentFieldState> {
  public render() {
    return input(`.${styles.argField}`, {
      type: "text",
      value: this.props.arg,
      onChange: (x: any) => this.props.handleChange(x.target.value),
    });
  }
}
