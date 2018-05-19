import { connect } from 'react-redux';

import { GState } from '../../reducers/index';
import {
  showNotifications,
  hideNotifications,
  toggleNotifications,
  removeNotification,
  clearNotifications,
} from '../../actions';
import { Navbar, NavStateProps, NavDispatchProps } from './Navbar';

const mapStateToProps = (state: GState): NavStateProps => {
  return {
    notifications: state.notifications,
    notificationsVisible: state.navbar.notificationsVisible,
  };
};

const mapDispatchToProps = (dispatch: any): NavDispatchProps => {
  return {
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
    clearNotifications: () => {
      dispatch(clearNotifications());
      dispatch(toggleNotifications());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
