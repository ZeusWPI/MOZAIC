export type NotificationType = 'Finished' | 'Error';

export interface Notification {
  title: string;
  body: string;
  link?: string;
  type: NotificationType;
}
