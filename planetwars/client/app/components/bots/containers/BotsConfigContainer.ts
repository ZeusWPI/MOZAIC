import * as Promise from 'bluebird'
import BotsConfig from '../BotsConfig'
import {connect} from "react-redux";
import {BotsState} from "../../../reducers";
import {BotConfig} from "../../../utils/Models";
import BotRefresher from "../../../utils/BotRefresher";

interface IBotsConfigContainer {
  loadedBot: BotConfig
}

const mapStateToProps = (store:BotsState, ownProps:IBotsConfigContainer ) => {
  return {
    loadedBot: ownProps.loadedBot
  }
};

const mapDispatchToProps = (dispatch: any) => {

  return {
    refreshBots: BotRefresher.refreshBots(dispatch)
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(BotsConfig)