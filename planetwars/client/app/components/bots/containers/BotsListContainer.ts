import BotsList  from '../BotsList';
import {connect} from "react-redux";
import BotRefresher from "../../../utils/BotRefresher";
import {IBotsPageState, IGState} from "../../../reducers";


const mapStateToProps = (state: IGState) => {
  return {
    bots: state.botsPage.bots
  }
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    refreshBots: BotRefresher.refreshBots(dispatch)
    }

};



export default connect(mapStateToProps, mapDispatchToProps)(BotsList)

