import { connect } from 'react-redux';

import { IGState } from '../reducers/index';
import { toggleNavMenu } from '../actions/actions';
import { Navbar } from '../components/Navbar';

const mapStateToProps = (state: IGState) => {
  return {
    toggled: state.navbar.toggled,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    toggle: () => {
      dispatch(toggleNavMenu());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
