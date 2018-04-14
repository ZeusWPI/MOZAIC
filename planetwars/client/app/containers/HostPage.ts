import { connect } from 'react-redux';

import { Host, HostDispatchProps, HostStateProps } from '../components/host/Host';
import { Importer } from '../utils/Importer';
import * as A from '../actions/actions';
import { IGState } from '../reducers';
import { BotID, BotSlot, BotSlotList, Token } from '../utils/ConfigModels';
import * as crypto from 'crypto';

const mapStateToProps = (state: IGState) => {
  const bots = state.bots;
  const selectedBots = state.playPage.selectedBots;
  const maps = state.maps;
  const selectedMap = state.playPage.selectedMap;
  return { bots, selectedBots, maps, selectedMap };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectBotInternal(name: string, id: BotID) {
      dispatch(A.selectBot({
        id,
        token: generateToken(),
        name,
      }));
    },
    selectBotExternal(name: string) {
      dispatch(A.selectBot({
        token: generateToken(),
        name,
      }));
    },
    unselectBot(uuid: BotID) {
      dispatch(A.unselectBot(uuid));
    },
    runMatch(params: A.MatchParams) {
      dispatch(A.runMatch(params));
    },
    changeLocalBot(token: Token, slot: BotSlot) {
      dispatch(A.changeLocalBot({token, slot}));
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
