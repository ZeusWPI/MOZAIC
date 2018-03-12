import { connect } from 'react-redux';

import { Bots, IBotsProps } from "../components/bots/Bots";
import { IGState } from '../reducers/index';
import { } from '../actions/actions';

interface IProps { match: any }

const mapStateToProps = (state: IGState, ownProps: IProps): IBotsProps => {
  return {
    // bots: state.bots.bots,
    bot: ownProps.match.params.bot,
  };
};

export default connect(mapStateToProps, undefined)(Bots);
