import BotElement from '../BotElement'
import * as Promise from 'bluebird'
import {BotsState} from "../../../reducers";
import {connect} from "react-redux";
import {botsRerender, removeBot} from "../../../actions/actions";
import {removeBotFileByName} from "../helpers/BotFileManager";
import {ObjectManager} from "../../../utils/ObjectManager";

interface BotElementContainerProps {
  name: string
  refreshBots: () => Promise<void>
}

const mapStateToProps = (state: BotsState, ownProps: BotElementContainerProps) => {
  return {
    name: ownProps.name,
    refreshBots : ownProps.refreshBots
  }

};

const mapDispatchToProps = (dispatch: any) => {

  return {

    removeBot: (name: string, evt: any): Promise<void> => {
      evt.preventDefault();
      return ObjectManager.deleteBotByName(name).then(
        () => dispatch(removeBot(name))
      ).then(
        () => Promise.resolve()
      )
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(BotElement)