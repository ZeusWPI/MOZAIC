import { connect } from 'react-redux';

import { GState } from '../../reducers';
import Info from './Info';

const mapStateToProps = (state: GState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Info);
