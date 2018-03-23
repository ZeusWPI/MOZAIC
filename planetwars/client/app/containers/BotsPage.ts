import { connect } from 'react-redux';

import { Bots, BotsStateProps, BotsDispatchProps, ConfigErrors } from "../components/bots/Bots";
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
    validate: (config: IBotConfig) => {
      const errors: ConfigErrors = {};
      if (!config.name || config.name.length === 0) {
        errors.name = 'Name should not be empty';
      }

      if (!config.command || config.command.length === 0) {
        errors.command = 'Command should not be empty';
      }

      return errors;
    },
  };
};

export default connect<BotsStateProps, BotsDispatchProps>(mapStateToProps, mapDispatchToProps)(Bots);
