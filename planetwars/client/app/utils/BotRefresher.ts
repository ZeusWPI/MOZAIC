import * as Promise from "bluebird";
import {ObjectManager} from "./ObjectManager";
import {clearBots, loadBot} from "../actions/actions";
import {BotConfig} from "./Models";

export default class BotRefresher {

  static refreshBots = (dispatch: any): () => Promise<void> => {
      dispatch(clearBots());
    return () =>
      ObjectManager.loadBots()
      .map((bot: BotConfig) => dispatch(loadBot(bot)))
      .all()
      .then(() => Promise.resolve());
  }
}