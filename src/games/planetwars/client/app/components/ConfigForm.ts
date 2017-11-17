import * as React from 'react';

const h = require('react-hyperscript');
const {
  div,
  ul,
  li,
  ol,
  input
} = require('hyperscript-helpers')(h);

interface Config {
  players: Player[],
  game_config: GameConfig,
  log_file: string
}

interface Player {
  name:string,
  command:string,
  args:string[]
}

interface GameConfig {
  player_map: PlayerMap,
  map_file: string,
  max_turns: number
}

interface PlayerMap {
  [key:string]:string
}

interface ConfigFormState {
  config: Config
}

export class ConfigForm extends React.Component<any, ConfigFormState> {
  constructor(props:any){
    super(props)
    this.state = {
      config: defaultConfig(),
    }
  }
  render() {
    var allPlayers = [];
    var playerConfig = this.state.config.players.slice();
    var size = playerConfig.length;
    for(var i = 0; i < size; i++)
    {
      var player = playerConfig[i];
      allPlayers.push(li({ key: i }, [new PlayerField({
          index: i,
          config: this.state.config,
          updateConfig: this.updateConfig.bind(this)
        }).render()]))
    }
    return div([
      ol(
        allPlayers
      ),
      input({type: "button", value: "Add Player", onClick:() => this.addPlayer()}),
      input({type: "text", placeholder:"Map File", onChange: (evt: Event) => this.setMapFile((<HTMLInputElement>evt.target).value)}),
      input({type: "text", placeholder:"Max Turns", onChange: (evt: Event) => this.setMaxTurns((<HTMLInputElement>evt.target).value)}),
      input({type: "text", placeholder:"Log File", onChange: (evt: Event) => this.setLogFile((<HTMLInputElement>evt.target).value)}),
      input({type: "button", value: "Done", onClick:() => this.outputJSON()})
    ])
  }

  addPlayer() {
    var conf = this.state.config;
    conf.players.push(defaultPlayer());
    this.setState({config: conf});
  }

  setMapFile(value:string) {
    var conf = this.state.config;
    conf.game_config.map_file = value;
    this.setState({config: conf});
  }

  setMaxTurns(value:string) {
    var conf = this.state.config;
    conf.game_config.max_turns = parseInt(value);
    this.setState({config: conf});
  }

  setLogFile(value:string) {
    var conf = this.state.config;
    conf.log_file = value;
    this.setState({config: conf});
  }

  removePlayer() {
    var conf = this.state.config;
    conf.players.pop();
    this.setState({config: conf});
  }

  updateConfig(conf:Config)
  {
    this.setState({ config: conf});
  }

  outputJSON() {
    console.log(JSON.stringify(this.state.config));
  }
}

interface PlayerFieldProps {
  index:number,
  config: Config,
  updateConfig: Function
}

interface PlayerFieldState {
  index:number,
  config: Config,
  updateConfig: Function
  name: string,
  command: string,
  args: string[]
}

class PlayerField extends React.Component<PlayerFieldProps, PlayerFieldState>
{
  constructor(props:PlayerFieldProps) {
    super(props);
    this.state = {
      index: this.props.index,
      config: this.props.config,
      updateConfig: this.props.updateConfig,
      name: this.props.config.players[this.props.index].name,
      command: this.props.config.players[this.props.index].command,
      args: this.props.config.players[this.props.index].args,
    }
  }
  render() {
    return ul([
        li({key: 1}, [input({type: "text", value: this.state.name, placeholder: "Name", onChange: (evt: Event) => this.setName((<HTMLInputElement>evt.target).value)} ), input({type: "button", value: "Remove Player", onClick:() => this.removePlayer()})]),
        li({key: 2}, [input({type: "text", value: this.state.command, placeholder: "Command", onChange: (evt: Event) => this.setCommand((<HTMLInputElement>evt.target).value)})]),
        li({key: 3}, [new ArgumentsField({arguments: this.state.args, updateArgs: this.updateArgs.bind(this)}).render()])
      ])
  }
  setName(name:string) {
    var conf = this.state.config;
    conf.players[this.state.index].name = name;
    this.state.updateConfig(conf);
  }
  setCommand(cmd:string) {
    var conf = this.state.config;
    conf.players[this.state.index].command = cmd;
    this.state.updateConfig(conf);
  }
  setArgs(args:string[]) {
    var conf = this.state.config;
    conf.players[this.state.index].args = args;
    this.state.updateConfig(conf);
  }
  removePlayer() {
    var conf = this.state.config;
    conf.players.splice(this.state.index, 1);
    this.state.updateConfig(conf);
  }
  updateArgs(args:string[]) {
    var conf = this.state.config;
    conf.players[this.state.index].args = args;
    this.state.updateConfig(conf);
  }
}

interface ArgumentsFieldProps {
  arguments: string[],
  updateArgs: Function
}

interface ArgumentsFieldState {
  arguments: string[],
  updateArgs: Function
}

class ArgumentsField extends React.Component<ArgumentsFieldProps, ArgumentsFieldState> {
  constructor(props:ArgumentsFieldProps) {
    super(props);
    this.state = {
      arguments: this.props.arguments,
      updateArgs: this.props.updateArgs
    }
  }
  render() {
    var allArgs = []
    for(var i = 0; i < this.state.arguments.length; i++)
    {
      allArgs.push(li({key: i}, [new ArgField({ argument: this.state.arguments[i], index: i, updateArgument: this.setArg.bind(this)}).render()]));
    }
    return div([ul(allArgs), input({type: "button", value: "+", onClick: () => this.addArgument()})]);
  }
  setArg(arg:string, index:number, remove:boolean) {
    if(remove)
    {
      this.state.arguments.splice(index, 1)
    } else {
      this.state.arguments[index] = arg;
    }
    this.state.updateArgs(this.state.arguments);
  }
  addArgument() {
    this.state.arguments.push("");
    this.state.updateArgs(this.state.arguments);
  }
}

interface ArgFieldProps {
  argument: string,
  index: number,
  updateArgument: Function
}

interface ArgFieldState {
  argument: string,
  index: number,
  updateArgument: Function
}

class ArgField extends React.Component<ArgFieldState, ArgFieldProps> {
  constructor(props: ArgFieldProps) {
    super(props);
    this.state = {
      argument: this.props.argument,
      index: this.props.index,
      updateArgument: this.props.updateArgument
    }
  }
  render() {
    return div([
      input({
        type: "text",
        value: this.state.argument,
        placeholder: "Argument",
        onChange: (evt: Event) => this.state.updateArgument((<HTMLInputElement>evt.target).value, this.state.index, false)
      }),
      input({
        type:"button",
        value:"-",
        onClick: () => this.state.updateArgument("", this.state.index, true)
      })
    ])
  }
}

function defaultConfig()
{
  return {
    players: [defaultPlayer()],
    game_config: defaultGameConfig(),
    log_file: ""
  }
}

function defaultGameConfig()
{
  return {
    player_map: {},
    map_file: "",
    max_turns: 0
  }
}

function defaultPlayer()
{
  return {
    name: "",
    command: "",
    args: [""]
  }
}
