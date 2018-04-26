import { connect } from 'react-redux';
import * as crypto from 'crypto';

import * as A from '../actions/index';
import * as M from '../utils/database/models';
import { GState } from '../reducers';
import { Importer } from '../utils/Importer';
import {Join, JoinDispatchProps, JoinState, JoinStateProps} from '../components/join/Join';

const mapStateToProps = null;

const mapDispatchToProps = (dispatch: any) => {
  return {join: (config: JoinState) => {dispatch(A.join)}}

};



export default connect<JoinStateProps, JoinDispatchProps>(mapStateToProps, mapDispatchToProps)(Join);
