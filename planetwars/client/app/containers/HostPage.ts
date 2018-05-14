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
  const selectedBots = state.host.selectedBots;
  return { bots, maps, selectedBots };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    newBotSlots(amount: number) {
      dispatch(A.newBotSlots(amount));
    },
    runMatch(params: M.MatchParams) {
      dispatch(A.runMatch(params));
    },
    toggleConnected(botslot: M.BotSlot) {
      if (botslot.connected) {
        dispatch(A.playerDisconnected(botslot));
      } else {
        dispatch(A.playerConnected(botslot));
      }
    },
    changeBotSlot(slot: M.BotSlot) {
      dispatch(A.changeBotSlot(slot));
    },
  };
};

export default connect<HostStateProps, HostDispatchProps>(mapStateToProps, mapDispatchToProps)(Host);
