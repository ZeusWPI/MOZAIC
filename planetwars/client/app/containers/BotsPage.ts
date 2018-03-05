import { connect } from 'react-redux';


import { Bots, IBotsProps } from "../components/bots/Bots";
import { IGState } from '../reducers/index';
import { } from '../actions/actions';

interface IProps { match: any }

const mapStateToProps = (state: IGState, ownProps: IProps): IBotsProps => {
  return {
    bots: state.bots.bots,
    bot: ownProps.match.params.bot,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {}
}

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
