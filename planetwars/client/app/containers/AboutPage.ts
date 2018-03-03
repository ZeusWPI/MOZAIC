import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import About from "../components/About"
import { IState, AboutState } from '../reducers/index';
import { incrementAbout } from '../actions/actions';
import { connect } from 'react-redux';

const mapStateToProps = (state: IState) => {
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