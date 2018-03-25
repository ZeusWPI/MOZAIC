import * as React from 'react';
import { shell } from 'electron';
import { a, div, h, h1, h2, li, p, pre, span, ul } from 'react-hyperscript-helpers';
import { Link, NavLink } from "react-router-dom";

// tslint:disable-next-line:no-var-requires
const styles = require('./Info.scss');

interface IProps {
}

interface IState {
}
export default class Info extends React.Component<IProps, IState> {
  public render() {
    return div(`.${styles.aboutPage}`, [
      h1(`.${styles.aboutTitle}`, 'Welcome to PlanetWars!'),

      h2(`.${styles.subTitle}`, 'Getting Started'),

      p(['In order to start a game, you will need at least 2 bots. ' +
        'Feel free to use the example bots provided. ' +
        'Unfortunately, selecting a single bot multiple times is currently not supported. ' +
        'To play a bot against itself, please add the bot to the client twice (see below). ' +
        'A “bot” is what we call the script you will write which will play the game. ' +
        'For more details on the the rules of PlanetWars and the scripting API, ' +
        'please refer to ',
      a({
        onClick: () =>
          shell.openExternal('https://github.com/ZeusWPI/MOZAIC/blob/development/planetwars/README.md')
      },
        ['this guide.']),
      ]),

      p(['Once you have created your planet-conquering script, you will need to configure it in the client. ' +
        'In order to do that, go to the ',
      h(Link, { to: '/Bots' }, ['Bots']),
        ' page, and enter the required details.']),

      ul(`.${styles.argsInfoList}`, [
        li([
          p('Name: surprise, the name of your bot. This is the name which will be used in the game logs, ' +
            'and which will be shown on the victory screen, so choose well!'),
        ]),

        li([
          p('Command: This is the command you would normally enter in your terminal to run your script. ' +
            'Make sure all required arguments (such as the filename) are provided here as well. ' +
            'Please use absolute paths as shell expansion is currently not supported. ' +
            'E.g: python3 “/home/YOUR_USERNAME/bots/my_awesome_bot.py”'),
        ]),
      ]),

      h2(`.${styles.subTitle}`, 'Playing A Game'),

      span(['With the bots configured as above, head on over to the ',
        h(Link, { to: '/Play' }, ['Play']),
        ' page. Here you will see all the bots you have registered. ' +
        'Select all the bots you would like to enter into battle. To deselect a bot, just click it again. ' +
        'Next, choose the map you would like to play on, or ',

        h(MapPanel, ['import your own. ']),

        'Set a turn limit, and finally, hit the Play button.']),

      h2(`.${styles.subTitle}`, 'Visualizing a Game'),

      p(['Once the game has finished playing, you can then load up the gamelog in the visualizer ' +
        'in order to fine-tune your strategy for the next match. ' +
        'To do this, go to the ',
      h(Link, { to: '/history' }, ['Matches']),
      ' page. Here you will see an overview of your completed matches. ' +
      'You can then select a match to load it into the ',
      h(Link, { to: '/Visualizer' }, ['visualizer']),
        '. Once the game is loaded, you can control the playback with the buttons at the bottom of the page.']),

    ]);

  }
}

interface IMapPanelProps {
  children: any;

}

interface IMapPanelState {
  toggled: boolean;
}

class MapPanel extends React.Component<IMapPanelProps, IMapPanelState> {
  constructor(props: any) {
    super(props);
    this.toggle = this.toggle.bind(this);

  }

  public componentWillMount() {

    this.setState({ toggled: false });
  }

  public render() {
    return span([
      a({ onClick: this.toggle }, this.props.children),
      div(`.${this.state.toggled ? styles.mapToggled : styles.mapHidden}`, [
        p('Maps are simply JSON files detailing the planet names, their positions, and the initial ship count. ' +
          'See below for an example structure:'),
        div(`.${styles.mapCode}`, [
          pre('' +
            '{\n' +
            '    "planets": [\n' +
            '        {\n' +
            '            "name": "protos",\n' +
            '            "x": -6,\n' +
            '            "y": 0,\n' +
            '            "owner": 1,\n' +
            '            "ship_count": 6\n' +
            '        },\n' +
            '        {\n' +
            '            "name": "duteros",\n' +
            '            "x": -3,\n' +
            '            "y": 5,\n' +
            '            "ship_count": 6\n' +
            '        },\n' +
            '    ]\n' +
            '}'),
        ]),
      ]),
    ]);
  }

  public toggle() {
    this.state.toggled ? this.setState({ toggled: false }) : this.setState({ toggled: true });
  }
}
