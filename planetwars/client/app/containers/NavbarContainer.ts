import { connect } from 'react-redux';

import { IGState } from '../reducers/index';
import {
  toggleNavMenu,
  showNotifications,
  hideNotifications,
  toggleNotifications,
  removeNotification,
} from '../actions/actions';
import { Navbar } from '../components/Navbar';

const mapStateToProps = (state: IGState) => {
  return {
    toggled: state.navbar.toggled,
    notifications: state.navbar.notifications,
    notificationsVisible: state.navbar.notificationsVisible,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    toggle: () => {
      dispatch(toggleNavMenu());
    },
    showNotifications: () => {
      dispatch(showNotifications());
    },
    hideNotifications: () => {
      dispatch(hideNotifications());
    },
    toggleNotifications: () => {
      dispatch(toggleNotifications());
    },
    removeNotification: (index: number) => {
      dispatch(removeNotification(index));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
