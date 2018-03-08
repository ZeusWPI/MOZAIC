import { connect } from 'react-redux';

import About from "../components/About"
import { IGState, AboutState } from '../reducers/index';
import { incrementAbout } from '../actions/actions';

const mapStateToProps = (state: IGState) => {
  return {
    counter: state.about.counter
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    onIncrement: () => {
      dispatch(incrementAbout())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(About);