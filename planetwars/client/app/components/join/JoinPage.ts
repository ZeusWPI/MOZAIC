import { connect } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import * as A from '../../actions';
import * as M from '../../database/models';

import { GState } from '../../reducers';
import { Join } from './Join';

const mapStateToProps = (state: GState) => {
  return {
    allBots: state.bots,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    joinMatch: (address: M.Address, bot: M.InternalBotSlot) => {
      const matchId = uuidv4();
      dispatch(A.joinMatch({
        matchId,
        address,
        token: bot.token,
        name: bot.name,
        botId: bot.botId,
      }));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Join);
