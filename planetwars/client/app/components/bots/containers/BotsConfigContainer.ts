import * as Promise from 'bluebird'
import BotsConfig from '../BotsConfig'
import {connect} from "react-redux";
import {IBotsPageState} from "../../../reducers";


import BotRefresher from "../../../utils/BotRefresher";
import {ObjectManager} from "../../../utils/ObjectManager";
import {IBotConfig} from "../../../utils/ConfigModels";
// import {saveBot} from "../../../actions/actions";

interface IBotsConfigContainer {
  loadedBot: IBotConfig | null
}

const mapStateToProps = (store:IBotsPageState, ownProps:IBotsConfigContainer ) => {
  return {
    loadedBot: ownProps.loadedBot
  }
};

const mapDispatchToProps = (dispatch: any) => {

  return {
    refreshBots: BotRefresher.refreshBots(dispatch),
    saveBot: (bot:IBotConfig) => {
      ObjectManager.saveBotFile(bot).then(
        () => BotRefresher.refreshBots(dispatch)());
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(BotsConfig)