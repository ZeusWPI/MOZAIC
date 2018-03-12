import * as Promise from 'bluebird'
import BotsConfig from '../BotsConfig'
import {connect} from "react-redux";
import {BotsState} from "../../../reducers";


import {BotConfig} from "../../../utils/Models";
import BotRefresher from "../../../utils/BotRefresher";
import {ObjectManager} from "../../../utils/ObjectManager";
import {saveBot} from "../../../actions/actions";

interface IBotsConfigContainer {
  loadedBot: BotConfig | null
}

const mapStateToProps = (store:BotsState, ownProps:IBotsConfigContainer ) => {
  return {
    loadedBot: ownProps.loadedBot
  }
};

const mapDispatchToProps = (dispatch: any) => {

  return {
    refreshBots: BotRefresher.refreshBots(dispatch),
    saveBot: (bot:BotConfig) => {
      ObjectManager.saveBotFile(bot).then(
        () => BotRefresher.refreshBots(dispatch)());
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(BotsConfig)