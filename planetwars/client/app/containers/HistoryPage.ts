import { connect } from 'react-redux';

import History from '../components/history/History';
import { IGState } from '../reducers/index';

// interface IProps

const mapStateToProps = (state: IGState) => {
  return {
    expandedGameId: 1,
    games: [{}],
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(History);
