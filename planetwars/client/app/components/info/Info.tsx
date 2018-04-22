import * as React from 'react';
import { shell } from 'electron';

import { Link, NavLink } from "react-router-dom";

// tslint:disable-next-line:no-var-requires
const styles = require('./Info.scss');

declare const __COMMIT_HASH__: string;
declare const __BRANCH_NAME__: string;
declare const __TAG__: string;

export default class Info extends React.Component<{}, { mapToggled: boolean }> {
  public state = { mapToggled: false };

  public launchReadme() {
    shell.openExternal('https://github.com/ZeusWPI/MOZAIC/blob/development/planetwars/README.md');
  }

  public render() {
    const Readme = () => (
      <a onClick={this.launchReadme}>
        README
      </a>);
    const toggle = (evt: any) => this.setState({ mapToggled: !this.state.mapToggled });
    return (
      <div className={styles.infoPage}>
        <Version />
        <MapPanel toggled={this.state.mapToggled} toggle={toggle} />
        <div className='container'>
          <div>
            <h1 className='title is-1 has-text-primary'>Welcome to PlanetWars!</h1>
          </div>
          <section className='section content'>
            <h2 className='title is-3 has-text-primary'>Getting started</h2>
            <p className={styles.wallOfText}>
              In order to start a game, you will need at least 2 bots.
              Feel free to use the example bots provided.
              Unfortunately, selecting a single bot multiple times is currently not supported.
              To play a bot against itself, please add the bot to the client twice (see below).
              A “bot” is what we call the script you will write which will play the game.
              For more details on the the rules of PlanetWars and the scripting API,
            please refer to the <Readme />.
          </p>
            <p className={styles.wallOfText}>
              Once you have created your planet-conquering script, you will need to configure it in the client.
            In order to do that, go to the <Link to='/bots' > Bots</Link> page and enter the required details.
          </p>
            <ul>
              <li>
                <p>
                  Name: surprise, the name of your bot.
              </p>
                <p>
                  This is the name which will be used in the game logs,
                  and which will be shown on the victory screen, so choose well!'
              </p>
              </li>
              <li>
                <p>
                  Command: This is the command you would normally enter in your terminal to run your script.
                  Make sure all required arguments (such as the filename) are provided here as well.
                  Please use absolute paths as shell expansion is currently not supported.
                  E.g: python3 “/home/YOUR_USERNAME/bots/my_awesome_bot.py”')
              </p>
              </li>
            </ul>
          </section>
          <section className='section content'>
            <h2 className="title is-3 has-text-primary">Playing a game</h2>
            <p>
              With the bots configured as above, head on over to the <Link to='/play'>Play</Link> page.
              Here you will see all the bots you have registered.
              Select all the bots you would like to enter into battle.
              To deselect a bot, just click it again.
              Next, choose the map you would like to play on, or  <a onClick={toggle}>import your own</a>.
              Set a turn limit, and finally, hit the Play button.
          </p>
          </section>
          <section className='section content'>
            <h2 className="title is-3 has-text-primary">Viewing a game</h2>
            <p>
              Once the game has finished playing, you can then load up the gamelog in the visualizer
              in order to fine-tune your strategy for the next match.
              To do this, go to the <Link to='/matches'> Matches </Link> page.
              Here you will see an overview of your completed matches.
              Once a game is selected, you can control the playback with the buttons at the bottom of the page.
          </p>
          </section>
        </div>
      </div >
    );
  }
}

export const Version: React.SFC<{}> = (props) => {
  let version = __BRANCH_NAME__ + "@" + __COMMIT_HASH__;
  if (__TAG__ !== "") {
    version = __TAG__;
  }
  return (
    <div className={styles.version}>
      Build: {version}
    </div>
  );
};

export class MapPanel extends React.Component<{ toggled: boolean, toggle: (evt: any) => void }, {}> {
  public render() {
    return (
      <div
        className={'modal ' + ((this.props.toggled) ? 'is-active' : '')}
        onClick={this.props.toggle}
      >
        <div className="modal-background" />
        <div className="modal-content">
          <p>
            Maps are simply JSON files detailing the planet names,
            their positions, and the initial ship count.
            See below for an example structure:
          </p>
          <pre>
            {`
            {
                "planets": [
                    {
                        "name": "protos",
                        "x": -6,
                        "y": 0,
                        "owner": 1,
                        "ship_count": 6
                    },
                    {
                        "name": "duteros",
                        "x": -3,
                        "y": 5,
                        "ship_count": 6
                    },
                ]
            }
            `}
          </pre>
        </div>
        <button className="modal-close is-large" />
      </div>
    );
  }
}
