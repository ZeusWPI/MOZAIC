import { connect } from 'react-redux';

import { incrementAbout } from '../actions/actions';
import { IAboutPageState, IGState } from '../reducers/index';
import About from '../components/about/About';

const mapStateToProps = (state: IGState) => {
  return {
    counter: state.aboutPage.counter,
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
