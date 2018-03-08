import BotElement from '../BotElement'
import {IState} from "../../../reducers";
import {connect} from "react-redux";
import {botsRerender, removeBot} from "../../../actions/actions";
import {removeBotFileByName} from "../helpers/BotFileManager";

interface BotElementContainerProps {
  name: string
  rerender: () => void
}

const mapStateToProps = (state: IState, ownProps: BotElementContainerProps) => {
  return {
    name: ownProps.name,
    rerender : ownProps.rerender
  }

};

const mapDispatchToProps = (dispatch: any) => {

  return {

    removeBot: (name: string, evt: any) => {
      removeBotFileByName(name);
      dispatch(removeBot(name, evt))
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(BotElement)