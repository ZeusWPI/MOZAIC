import { connect } from 'react-redux';

import { IState } from '../reducers/index';
import { toggleNavMenu } from '../actions/actions';
import { Navbar } from '../components/Navbar';

const mapStateToProps = (state: IState) => {
  return {
    toggled: state.navbar.toggled
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    toggle: () => {
      dispatch(toggleNavMenu())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);