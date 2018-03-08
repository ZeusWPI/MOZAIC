import { connect } from 'react-redux';

import { incrementAbout } from '../actions/actions';
import About from '../components/About';
import { IAboutState, IGState } from '../reducers/index';

const mapStateToProps = (state: IGState) => {
  return {
    counter: state.about.counter,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    onIncrement: () => {
      dispatch(incrementAbout());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(About);
