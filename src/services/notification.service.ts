import {NotificationDataSource} from '../datasources/notification.datasource';
import {SmsNotification} from '../models/sms-notification.model';

const twilio = require("twilio");

export class NotificationService {

  async SmsNotification(notification: SmsNotification): Promise<boolean> {
    try {
      const accountSid = NotificationDataSource.TWILIO_SID;
      const authToken = NotificationDataSource.TWILIO_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);

      await client.messages
        .create({
          body: notification.body,
          from: NotificationDataSource.TWILIO_FROM,
          to: notification.to
        })
        .then((message: any) => {
          console.log(message);
        });
      return true;
    } catch (error) {
      return false;
    }
  }
