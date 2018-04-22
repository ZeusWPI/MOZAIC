import { connect } from 'react-redux';

import { AboutPageState, GState } from '../reducers/index';
import Info from '../components/info/Info';

const mapStateToProps = (state: GState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Info);
