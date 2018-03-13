import { connect } from 'react-redux';

import { Bots, IBotsProps } from "../components/bots/Bots";
import { IGState } from '../reducers/index';
import { addBot, removeBot } from '../actions/actions';
import { IBotConfig } from "../utils/ConfigModels";

interface IProps {
  match: any;
}

const mapStateToProps = (state: IGState, ownProps: IProps) => {
  const { bots } = state.botsPage;
  const selectedName: string = ownProps.match.params.bot;
  const empty: IBotConfig = { name: '', args: [], command: '' };
  const selectedBot = bots.find((bot) => bot.name === selectedName) || empty;
  return { bots, selectedBot };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    saveBot: (bot: IBotConfig) => {
      dispatch(addBot(bot));
    },
    removeBot: (name: string) => {
      dispatch(removeBot(name));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Bots);
