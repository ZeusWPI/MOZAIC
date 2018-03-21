import {connect} from 'react-redux';

import {IAboutPageState, IGState} from '../reducers/index';
import About from '../components/about/About';

const mapStateToProps = (state: IGState) => {
  return {};
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(About);
