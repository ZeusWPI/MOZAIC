import * as Promise from "bluebird";
import {ObjectManager} from "./ObjectManager";
import {addBot, clearBots} from "../actions/actions";
import {IBotConfig} from "./ConfigModels";

export default class BotRefresher {

  static refreshBots = (dispatch: any): () => Promise<void> => {
      dispatch(clearBots());
    return () =>
      ObjectManager.loadBots()
      .map((bot: IBotConfig) => dispatch(addBot(bot)))
      .all()
      .then(() => Promise.resolve());
  }
}