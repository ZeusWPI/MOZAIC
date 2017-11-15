const React = require('react');
const execFile = require('child_process').execFile;
const h = require('react-hyperscript');
const {button,} = require('hyperscript-helpers')(h);
const fs = require('fs');
class Runbutton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "Click here to start",
    };
  }
  render() {
    return button({
        className: "runbutton",
        onClick: () => this.setState({value: this.runBotRunner()}),
        title: this.state.value
      }, [this.state.value]
    );
  }
  runBotRunner() {
    const child = execFile('./bot_driver', ['../config_examples/stub.config.json'], (error, stdout, stderr) => {
        if (error) {
            console.error('stderr', stderr);
        }
        
        fs.readFile("./gamelog.json", "utf-8", (err, data) =>  {this.setState({value: "Done executing", gamelog: data}); this.props.gamesetter(data)});

    });
    return "Loading..."
  }
}

module.exports = Runbutton