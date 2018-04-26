import { connect } from 'react-redux';
import * as crypto from 'crypto';

import * as A from '../actions/index';
import * as M from '../utils/database/models';
import { GState } from '../reducers';
import { Importer } from '../utils/Importer';
import { Host, HostDispatchProps, HostStateProps } from '../components/host/Host';

const mapStateToProps = (state: GState) => {
  const bots = state.bots;
  const maps = state.maps;
  return { bots, maps };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    // selectBotInternal(name: string, botId: BotId) {
    //   dispatch(A.selectBot({
    //     type: 'internal',
    //     botId,
    //     token: generateToken(),
    //     name,
    //   }));
    // },
    // selectBotExternal(name: string) {
    //   dispatch(A.selectBot({
    //     type: 'external',
    //     token: generateToken(),
    //     name,
    //   }));
    // },
    // unselectBot(uuid: BotId) {
    //   dispatch(A.unselectBot(uuid));
    // },
    runMatch(params: M.MatchParams) {
      dispatch(A.runMatch(params));
    },
    generateToken,
    // changeLocalBot(token: Token, slot: BotSlot) {
    //   dispatch(A.changeLocalBot(slot));
    // },
    // selectMap(id: string) {
    //   dispatch(A.selectMap(id));
    // },
  };
};

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return token;
}

export default connect<HostStateProps, HostDispatchProps>(mapStateToProps, mapDispatchToProps)(Host);
