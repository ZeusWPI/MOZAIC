import { connect } from 'react-redux';

import { IAboutPageState, IGState } from '../reducers/index';
import Info from '../components/info/Info';

const mapStateToProps = (state: IGState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Info);
