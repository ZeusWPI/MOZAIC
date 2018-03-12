import {connect} from 'react-redux';


import {Bots, IBotsProps} from "../components/bots/Bots";
import {IGState} from '../reducers/index';
import {} from '../actions/actions';
import {IBotConfig} from "../utils/ConfigModels";

interface IProps {
  match: any
}

const mapStateToProps = (state: IGState, ownProps: IProps): IBotsProps => {
  return {
    // bots: state.bots.bots,
    bot: selectBotByName(state, ownProps)
  }

};

const selectBotByName = (state: IGState, ownProps: IProps): IBotConfig | null => {

    let botname = ownProps.match.params.bot;
    if (botname) {

      let selectedBot: any = state.botsPage.bots.find((bot: IBotConfig) => bot.name == botname);
      if (selectedBot) {
        return selectedBot
      }
      else {
        throw new Error('Bot not found');
      }
    }
    else {
      return null;
    }

  }
;

export default connect(mapStateToProps, null)(Bots);


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
