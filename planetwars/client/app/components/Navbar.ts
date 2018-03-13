import { h, nav, div, span, i, header, p, button, a, section, footer } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import * as React from 'react';

import { INotification } from '../utils/UtilModels';

interface INavProps {
  toggled: boolean;
  notifications: INotification[];
  toggle: () => void;
  notificationsVisible: boolean;
  toggleNotifications: () => void;
  hideNotifications: () => void;
  showNotifications: () => void;
  removeNotification: (key: number) => void;
}

export class Navbar extends React.Component<INavProps, {}> {

  public render() {
    const active = this.props.toggled ? '.is-active' : '';
    return [
      nav(`.navbar`, [
        div(`.navbar-burger${active}`,
          {
            onClick: () => this.props.toggle(),
          }, [
            span(),
            span(),
            span(),
          ]),
        div(`.navbar-menu${this.props.toggled ? '.is-active' : ''}`, [
          div(`.navbar-start`, [
            h(Link, `.navbar-item`, { to: '/home' }, ['Home']),
            h(Link, `.navbar-item`, { to: '/bots' }, ['Bots']),
            h(Link, `.navbar-item`, { to: '/play' }, ['Play']),
            h(Link, `.navbar-item`, { to: '/queue' }, ['Queue']),
            h(Link, `.navbar-item`, { to: '/history' }, ['Game History']),
            h(Link, `.navbar-item`, { to: '/about' }, ['About']),
            h(Link, `.navbar-item`, { to: '/visualizer' }, ['Visualizer']),
          ]),
          div(`.navbar-end`, [
            a(`.navbar-item.modal-button`, {
              'onClick': () => this.showModal(),
              'data-target': 'modal-notification',
            }, [
              i('.fa.fa-lg.fa-bell.notificationBell', {
                'notification-count': this.props.notifications.length,
                'aria-hidden': true,
              }),
            ]),
          ]),
        ]),
      ]),
      h(NotificationModal, {
        visible: this.props.notificationsVisible,
        notifications: this.props.notifications,
        hideModal: () => this.hideModal(),
        removeNotification: (key: number) => this.props.removeNotification(key),
      }),
    ];
  }

  protected hideModal() {
    this.props.hideNotifications();
  }

  private showModal() {
    this.props.showNotifications();
  }
}

interface INotificationModalProps {
  notifications: INotification[];
  visible: boolean;
  hideModal: () => void;
  removeNotification: (key: number) => void;
}

interface INotificationElementProps {
  notification: INotification;
  key: number;
  remove: () => void;
}

// tslint:disable-next-line:variable-name
const NotificationElement: React.SFC<INotificationElementProps> = (props) => {
  return div(".card", [
    header(".card-header", [
      p(".card-header-title", [props.notification.title]),
      span(".card-header-icon", [
        button(".delete", {
          onClick: () => props.remove(),
        }),
      ]),
    ]),
    div(".card-content#notification-body", [
      div(".content", [props.notification.body]),
    ]),
  ]);
};

class NotificationModal extends React.Component<INotificationModalProps> {

  public render() {
    const notificationElements = this.props.notifications.map((notification: INotification, key: number) => {
      return h(NotificationElement, {
        notification,
        key,
        remove: () => this.props.removeNotification(key),
      });
    });
    return div(`.modal#modal-notification${ this.props.visible ? ".is-active" : "" }`, [
      div('.modal-background', {
        onClick: this.props.hideModal,
      }),
      div('.modal-card', [
        header('.modal-title', [
          p('.modal-card-title', ["Notifications"]),
          button('.delete', {
            'aria-label': close,
            'onClick': this.props.hideModal,
          }),
        ]),
        section(".modal-card-body", [notificationElements]),
        footer(".modal-card-foot", ["Hello, World!"]),
      ]),
    ]);
  }
}
