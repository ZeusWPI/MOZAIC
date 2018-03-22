import * as React from 'react';
import {a, div, h, h1, h2, p} from 'react-hyperscript-helpers';
import {Link} from "react-router-dom";

interface IProps {
}

interface IState {
}
// TODO: either make the link to github open externally or add a way to get back to the about page
export default class About extends React.Component<IProps, IState> {
  public render() {
    return div([
      h1('Welcome to PlanetWars!'),

      h2('Getting Started'),

      p(['In order to start a game, you will need at least 2 bots. ' +
        'A “bot” is what we call the script you will write which will play the game. ' +
        'For more details on the the rules of PlanetWars and the scripting API, ' +
        'please refer to ',
        a({href: 'https://github.com/ZeusWPI/MOZAIC/blob/development/planetwars/README.md'}, ['this guide.']),
      ]),

      p(['Once you have created your planet-conquering script, you will need to configure it in the client. ' +
        'In order to do that, go to the ',
        h(Link, {to: '/Bots'}, ['Bots']),
        ' page, and enter the required details.']),

      p('Name: surprise, the name of your bot. This is the name which will be used in the game logs, ' +
        'and which will be shown on the victory screen, so choose well!'),

      p('Command: This is the command you would normally enter in your terminal to run your script. ' +
        'Make sure all required arguments (such as the filename) are provided here as well.' +
        'E.g: python3 “~/bots/my_awesome_bot.py”'),

      h2('Playing A Game'),

      p(['With the bots configured as above, head on over to the ',
        h(Link, {to: '/Play'}, ['Play']),
        ' page. Here you will see all the bots you have registered. ' +
        'Select all the bots you would like to enter into battle. To deselect a bot, just click it again.' +
        'Next, choose the map you would like to play on, or import your own. ' +
        'Set a turn limit, and finally, hit the Play button.']),

      h2('Visualizing a Game'),

      p(['Once the game has finished playing, you can then load up the gamelog in the visualizer ' +
      'in order to fine-tune your strategy for the next match. ' +
      'To do this, go to the ',
        h(Link, {to: '/Visualizer'}, ['Visualizer']),
        ' page and press the “load game” button. ' +
        'Once the game is loaded, you can control the playback with the buttons at the bottom of the page.']),

    ]);

  }
}
