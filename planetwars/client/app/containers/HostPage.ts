import { connect } from 'react-redux';

import { Host, HostDispatchProps, HostStateProps } from '../components/host/Host';
import { Importer } from '../utils/Importer';
import * as A from '../actions/index';
import { GState } from '../reducers';
import { BotId, BotSlot, BotSlotList, Token } from '../utils/database/models';
import * as crypto from 'crypto';

const mapStateToProps = (state: GState) => {
  const bots = state.bots;
  const selectedBots = state.playPage.selectedBots;
  const maps = state.maps;
  const selectedMap = state.playPage.selectedMap;
  return { bots, selectedBots, maps, selectedMap };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectBotInternal(name: string, botId: BotId) {
      dispatch(A.selectBot({
        type: 'internal',
        botId,
        token: generateToken(),
        name,
      }));
    },
    selectBotExternal(name: string) {
      dispatch(A.selectBot({
        type: 'external',
        token: generateToken(),
        name,
      }));
    },
    unselectBot(uuid: BotId) {
      dispatch(A.unselectBot(uuid));
    },
    runMatch(params: A.MatchParams) {
      dispatch(A.startServer(params));
    },
    changeLocalBot(token: Token, slot: BotSlot) {
      dispatch(A.changeLocalBot(slot));
    },
    selectMap(id: string) {
      dispatch(A.selectMap(id));
    },
  };
};

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return token;
}

export default connect<HostStateProps, HostDispatchProps>(mapStateToProps, mapDispatchToProps)(Host);
