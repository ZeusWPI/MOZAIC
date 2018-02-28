import { store } from "../index"
import { MatchConfig } from "./Models"
import { gameStarted, gameFinished, gameCrashed } from '../actions/actions';

const execFile = require('child_process').execFile;

export default class GameRunner {
  conf:MatchConfig;
  constructor(conf:MatchConfig) {
    this.conf = conf;
    this.runBotRunner();
  }

  runBotRunner() {
    store.dispatch(gameStarted())
    const child = execFile("./../../../botdriver/target/debug/mozaic_bot_driver.exe", [this.conf], ((error:any, stdout:any, stderr:any) => {
      if (error) {
          // console.error(error);
          // console.log("Botrunner returned: ", stdout);
          // console.error(stderr);
          // this.setState({value: "Error, see console for details"});
          store.dispatch(gameCrashed())
      } else {
          // fs.readFile("./gamelog.json", "utf-8", (err:string, data:string) =>  { this.setState({value: "Done executing", gamelog: data}); this.props.gamesetter(data) });
          store.dispatch(gameFinished())
      }
    }));
  }
}
