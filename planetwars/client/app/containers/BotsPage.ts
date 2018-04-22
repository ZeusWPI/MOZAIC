import { connect } from 'react-redux';

import { Bots, BotsStateProps, BotsDispatchProps, ConfigErrors } from "../components/bots/Bots";
import { GState } from '../reducers/index';
import { addBot, removeBot, editBot } from '../actions/actions';
import { BotConfig, BotData, BotId } from "../utils/database/models";

interface Props {
  match: any;
}

const mapStateToProps = (state: GState, ownProps: Props) => {
  const bots = state.bots;
  const uuid: BotId | undefined = ownProps.match.params.bot;
  if (uuid) {
    const selectedBot: BotData = bots[uuid];
    return { bots, selectedBot };
  }
  return { bots };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    addBot: (config: BotConfig) => {
      dispatch(addBot(config));
    },
    removeBot: (uuid: BotId) => {
      dispatch(removeBot(uuid));
    },
    editBot: (bot: BotData) => {
      dispatch(editBot(bot));
    },
    validate: (config: BotConfig) => {
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
