import {connect} from 'react-redux';


import {Bots, IBotsProps} from "../components/bots/Bots";
import {IGState} from '../reducers/index';
import {} from '../actions/actions';
import {BotConfig} from "../utils/Models";

interface IProps {
  match: any
}

const mapStateToProps = (state: IGState, ownProps: IProps): IBotsProps => {
  return {
    // bots: state.bots.bots,
    bot: selectBotByName(state, ownProps.match.params.bot),
  }
};

const mapDispatchToProps = (dispatch: any, ownProps: IProps) => {


};

const selectBotByName = (state: IGState, botname: string): BotConfig => {
  let selectedBot: any = state.bots.bots.find((bot: BotConfig) => bot.name == botname);
  if (selectedBot) {
    return selectedBot
  }
  else {
    throw new Error('Bot not found');
  }

};

export default connect(mapStateToProps, mapDispatchToProps)(Bots);


// interface BotsPageState {

// }

// export default class BotsPage extends React.Component<BotsPageProps, BotsPageState> {
//   constructor(props: BotsPageProps) {
//     super(props);
//   }
//   render() {
//     return (
//       h(Bots, { bot: this.props.match.params.bot })
//     );
//   }
// }
