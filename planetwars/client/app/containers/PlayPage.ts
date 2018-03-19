import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';
import { PlayPage, IPlayPageStateProps, IPlayPageDispatchProps } from '../components/play2/PlayPage';

import { connect } from 'react-redux';
import { IGState } from '../reducers';

const mapStateToProps = (state: IGState) => {
  const bots = state.bots;
  const selectedBots = Object.keys(bots).slice(0, 1);
  return { bots, selectedBots };
};

const mapDispatchToProps = (dispatch: any) => {
  return {

  };
};

export default connect<IPlayPageStateProps, IPlayPageDispatchProps>(mapStateToProps, mapDispatchToProps)(PlayPage);
