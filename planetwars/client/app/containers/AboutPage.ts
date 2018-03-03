import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import About from "../components/About"
import { IState, AboutState } from '../reducers/index';
import { plusOne } from '../actions/actions';
import { connect } from 'react-redux';

const mapStateToProps = (state: IState) => {
  return {
    counter: state.about.counter
  }
}

const mapDistpatchToProps = (dispatch: any) => {
  return {
    onIncrement: () => {
      dispatch(plusOne())
    }
  }
}

export default connect(mapStateToProps, mapDistpatchToProps)(About);