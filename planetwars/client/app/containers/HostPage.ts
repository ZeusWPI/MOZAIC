import { connect } from 'react-redux';

import { Host, HostDispatchProps, HostStateProps } from '../components/host/Host';
import { Importer } from '../utils/Importer';
import * as A from '../actions/actions';
import { IGState } from '../reducers';
import { BotID, BotSlot } from '../utils/ConfigModels';

const mapStateToProps = (state: IGState) => {
  const bots = state.bots;
  const selectedBots = state.playPage.selectedBots;
  const maps = state.maps;
  return { bots, selectedBots, maps };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    selectBotInternal(name: string, id: BotID) {
      dispatch(A.selectBot({
        id: id,
        token: "TODO",
        name: name,
      }));
    },
    selectBotExternal(name: string) {
      dispatch(A.selectBot({
        token: "TODO",
        name: name,
      }));
    },
    unselectBot(uuid: BotID, all: boolean = false) {
      if (all) {
        dispatch(A.unselectBotAll(uuid));
      } else {
        dispatch(A.unselectBot(uuid));
      }
    },
    runMatch(params: A.MatchParams) {
      dispatch(A.runMatch(params));
    },
  };
};

export default connect<HostStateProps, HostDispatchProps>(mapStateToProps, mapDispatchToProps)(Host);
