import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';
import { PlayPage, IPlayPageStateProps, IPlayPageDispatchProps } from '../components/play2/PlayPage';
import { connect } from 'react-redux';

import * as A from '../actions/actions';
import { IGState } from '../reducers';
import { BotID } from '../utils/ConfigModels';
import { unselectBot } from '../actions/actions';

const mapStateToProps = (state: IGState) => {
  const bots = state.bots;
  const selectedBots = state.playPage.selectedBots;
  return { bots, selectedBots };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectBot(uuid: BotID) {
      dispatch(A.selectBot(uuid));
    },
    unselectBot(uuid: BotID, all: boolean = false) {
      if (all) {
        dispatch(A.unselectBotAll(uuid));
      } else {
        dispatch(A.unselectBot(uuid));
      }
    },
  };
};

export default connect<IPlayPageStateProps, IPlayPageDispatchProps>(mapStateToProps, mapDispatchToProps)(PlayPage);
