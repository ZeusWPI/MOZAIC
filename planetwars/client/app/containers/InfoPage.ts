import { connect } from 'react-redux';

import { AboutPageState, IGState } from '../reducers/index';
import Info from '../components/info/Info';

const mapStateToProps = (state: IGState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Info);
