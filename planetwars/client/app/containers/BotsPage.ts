import { connect } from 'react-redux';

import { Bots, IBotsStateProps, IBotsFuncProps } from "../components/bots/Bots";
import { IGState } from '../reducers/index';
import { addBot, removeBot, editBot } from '../actions/actions';
import { IBotConfig, IBotData, BotID } from "../utils/ConfigModels";

interface IProps {
  match: any;
}

const mapStateToProps = (state: IGState, ownProps: IProps) => {
  const bots = state.bots;
  const uuid: BotID | undefined = ownProps.match.params.bot;
  if (uuid) {
    const selectedBot: IBotData = bots[uuid];
    return { bots, selectedBot };
  }
  return { bots };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    addBot: (config: IBotConfig) => {
      dispatch(addBot(config));
    },
    removeBot: (uuid: BotID) => {
      dispatch(removeBot(uuid));
    },
    editBot: (bot: IBotData) => {
      dispatch(editBot(bot));
    },
  };
};

export default connect<IBotsStateProps, IBotsFuncProps>(mapStateToProps, mapDispatchToProps)(Bots);
