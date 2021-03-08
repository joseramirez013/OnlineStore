// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {HttpErrors, post, requestBody} from '@loopback/rest';
import {EmailNotification} from '../models/email-notification.model';
import {SmsNotification} from '../models/sms-notification.model';
import {CustomerRepository, UserRepository} from '../repositories';
import {AuthService} from '../services/auth.services';
import {NotificationService} from '../services/notification.services';
>>>>>>> resetPassword

// import {inject} from '@loopback/core';

class Credentials {
  username: string;
  password: string;
}

class PasswordResetData {
  username: string;
  type: number;
}

export class UserController {

  authService: AuthService;

  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository
  ) {
    this.authService = new AuthService(this.userRepository);
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Login for users'
      }
    }
  })
  async login(
    @requestBody() credentials: Credentials
  ): Promise<object> {
    let user = await this.authService.Identify(credentials.username, credentials.password);
    if (user) {
      let tk = await this.authService.GenerateToken(user);
      return {
        data: user,
        token: tk
      }
    } else {
      throw new HttpErrors[401]("User or password invalid.");
    }
  }

  @post('/password-reset', {
    responses: {
      '200': {
        description: 'Login for users'
      }
    }
  })
  async reset(
    @requestBody() passwordResetData: PasswordResetData
  ): Promise<boolean> {
    let randomPassword = await this.authService.ResetPassword(passwordResetData.username);
    if (randomPassword) {
      // send SMS or mail with new password
      // 1. SMS
      // 2. Mail
      // ....
      let customer = await this.customerRepository.findOne({where: {document: passwordResetData.username}})
      switch (passwordResetData.type) {
        case 1:
          // Send SMS
          if (customer) {
            let notification = new SmsNotification({
              body: `Su nueva contraseña es: ${randomPassword}`,
              to: customer.telephone
            });
            let sms = await new NotificationService().SmsNotification(notification);
            if (sms) {
              console.log("SMS message sent");
              return true;
            }
            throw new HttpErrors[400]("Phone is not found");
          }
          throw new HttpErrors[400]("User not found");
          break;
        case 2:
          // Send mail
          if (customer) {
            let notification = new EmailNotification({
              textBody: `Su nueva contraseña es: ${randomPassword}`,
              htmlBody: `Su nueva contraseña es: ${randomPassword}`,
              to: customer.email,
              subject: 'Nueva contraseña'
            });
            let mail = await new NotificationService().MailNotification(notification);
            if (mail) {
              console.log("Mail message sent");
              return true;
            }
            throw new HttpErrors[400]("Email is not found");
          }
          throw new HttpErrors[400]("User not found");
          break;

        default:
          throw new HttpErrors[400]("This notification type is not supported");
          break;
      }
    }
    throw new HttpErrors[400]("User not found");
  }

}
