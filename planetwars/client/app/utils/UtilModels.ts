export type NotificationType = 'Finished' | 'Error';

export interface INotification {
  title: string;
  body: string;
  link?: string;
  type: NotificationType;
}
