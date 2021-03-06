import { connect } from 'react-redux';
import * as crypto from 'crypto';

import * as A from '../../actions';
import * as M from '../../database/models';
import { GState } from '../../reducers';
import { Importer } from '../../utils/Importer';
import { Join, JoinDispatchProps, JoinState, JoinStateProps } from './Join';

const mapStateToProps = (state: GState) => {
  return {
    allBots: state.bots,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    joinMatch: (address: M.Address, bot: M.InternalBotSlot) => {
      dispatch(A.joinMatch(address, bot));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Join);
