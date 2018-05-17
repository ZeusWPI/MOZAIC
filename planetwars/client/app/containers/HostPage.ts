import { connect } from 'react-redux';
import * as crypto from 'crypto';

import * as A from '../actions/index';
import * as M from '../utils/database/models';
import { generateToken } from "../utils/GameRunner";
import { GState } from '../reducers';
import { Importer } from '../utils/Importer';
import { Host, HostDispatchProps, HostStateProps } from '../components/host/Host';

const mapStateToProps = (state: GState) => {
  const bots = state.bots;
  const maps = state.maps;
  const selectedBots = state.host.slots;
  const ctrlToken = generateToken();
  const serverShouldStart = (state.host.matchParams !== undefined) && !state.host.serverRunning;
  console.log(serverShouldStart);
  return { bots, maps, selectedBots, ctrlToken, serverShouldStart };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    setupServer(params: M.ServerParams) {
      dispatch(A.setupServer(params));
    },
    startServer() {
      dispatch(A.runMatch());
    },
    toggleConnected(botslot: M.BotSlot) {
      if (botslot.connected) {
        dispatch(A.playerDisconnected(botslot.token));
      } else {
        dispatch(A.playerConnected(botslot.token));
      }
    },
    changeBotSlot(slot: M.BotSlot) {
      dispatch(A.changeBotSlot(slot));
    },
    sendGo() {
      dispatch(A.sendGo());
    },
  };
};

export default connect<HostStateProps, HostDispatchProps>(mapStateToProps, mapDispatchToProps)(Host);
