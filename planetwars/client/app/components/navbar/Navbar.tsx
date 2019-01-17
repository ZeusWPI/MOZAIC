import * as React from 'react';
import * as h from 'react-hyperscript';

import { Link } from 'react-router-dom';

import { Notification } from '../../database/models';

/*
 * CSS for the navbar is found in app.global.scss cause it's pretty unique
 * and most of it relies on global Bulma anyway.
 */

export type NavProps = NavStateProps & NavDispatchProps;
export interface NavStateProps {
  notifications: Notification[];
  notificationsVisible: boolean;
}
export interface NavDispatchProps {
  toggleNotifications: () => void;
  hideNotifications: () => void;
  showNotifications: () => void;
  removeNotification: (key: number) => void;
  clearNotifications: () => void;
}

interface NavState { toggled: boolean; }

export class Navbar extends React.Component<NavProps, NavState> {
  public state: NavState = { toggled: false };

  public render() {
    const active = this.state.toggled ? '.is-active' : '';
    return h(`nav.navbar`, [
      h(`div.navbar-burger${active}`, {
        onClick: () => this.setState({ toggled: !this.state.toggled }),
      }, [h('span'), h('span'), h('span')]),
      h(`div.navbar-menu${this.state.toggled ? '.is-active' : ''}`, [
        h(`div.navbar-start`, [
          h(Link, { className: 'navbar-item', to: "/bots" }, ["Bots"]),
          h(Link, { className: 'navbar-item', to: "/play" }, ["Play"]),
          h(Link, { className: 'navbar-item', to: "/join" }, ["Join"]),
          h(Link, { className: 'navbar-item', to: "/matches" }, ["Matches"]),
        ]),
        h(`div.navbar-end`, [
          h(Link, { className: 'navbar-item', to: "/info" }, ["Info"]),
          h(`a.navbar-item.modal-button`,
            {
              'onClick': () => this.showModal(),
              'data-target': 'modal-notification',
            }, [
              h('i.fa.fa-lg.fa-bell.notificationBell', {
                'notification-count': this.props.notifications.length,
                'aria-hidden': true,
              }),
            ]),
        ]),
      ]),
      h(NotificationModal, {
        visible: this.props.notificationsVisible,
        notifications: this.props.notifications,
        hideModal: () => this.hideModal(),
        removeNotification: (key: number) => this.props.removeNotification(key),
        clearNotifications: () => this.props.clearNotifications(),
      }),
    ]);
  }

  protected hideModal() {
    this.props.hideNotifications();
  }

  private showModal() {
    this.props.showNotifications();
  }
}

interface NotificationModalProps {
  notifications: Notification[];
  visible: boolean;
  hideModal: () => void;
  removeNotification: (key: number) => void;
  clearNotifications: () => void;
}

export class NotificationModal extends React.Component<NotificationModalProps> {

  public render() {
    const { notifications } = this.props;

    const notificationElements = notifications.map((notification: Notification, key: number) => {
      return h(NotificationElement, {
        notification,
        key,
        remove: () => this.props.removeNotification(key),
      });
    });

    const content = (notifications.length !== 0)
      ? notificationElements
      : h(NoNotifications);

    return h(`div.modal#modal-notification${this.props.visible ? ".is-active" : ""}`, [
      h('div.modal-background', {
        onClick: this.props.hideModal,
      }),
      h('div.modal-card', [
        h('header.modal-card-head', [
          h('p.modal-card-title', ["Notifications"]),
          h('button.delete.is-primary', {
            'aria-label': close,
            'onClick': this.props.hideModal,
          }),
        ]),
        h("section.modal-card-body", [content]),
        h("footer.modal-card-foot", [
          h("button.button.is-primary", {
            onClick: () => this.props.clearNotifications(),
          }, ["Mark all as read & close"])]),
      ]),
    ]);
  }
}

export const NoNotifications: React.SFC = (props) => {
  return h("div.card", [
    h("header.card-header", [
      h("p.card-header-title", ['No notifications!']),
    ]),
    h("div.card-content#notification-body", [
      h("div.content", ['Try playing some games.']),
    ]),
  ]);
};

interface NotificationElementProps {
  notification: Notification;
  key: number;
  remove: () => void;
}

export const NotificationElement: React.SFC<NotificationElementProps> = (props) => {
  let icon = "";
  let spanClass = "";
  switch (props.notification.type) {
    case 'Finished': {
      icon = ".fa.fa-check-square";
      spanClass = ".icon.has-text-success";
      break;
    }
    case 'Error':
    default: {
      icon = ".fa.fa-exclamation-triangle";
      spanClass = ".icon.has-text-danger";
      break;
    }
  }

  return h("div.card", [
    h("header.card-header", [
      h("p.card-header-title", [
        h(`span${spanClass}`, [
          h(`i${icon}`),
        ]),
        props.notification.title,
      ]),
      h(".card-header-icon", [
        h("button.delete", {
          onClick: () => props.remove(),
        }),
      ]),
    ]),
    h("div.card-content#notification-body", [
      h("div.content", [props.notification.body]),
    ]),
  ]);
};
