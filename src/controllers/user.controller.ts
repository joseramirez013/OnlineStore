// Uncomment these imports to begin using these cool features!

import {repository} from '@loopback/repository';
import {HttpErrors, post, requestBody} from '@loopback/rest';
import {EmailNotification} from '../models/email-notification.model';
import {SmsNotification} from '../models/sms-notification.model';
import {CustomerRepository, ShoppingCartRepository, UserRepository} from '../repositories';
import {AuthService} from '../services/auth.services';
import {NotificationService} from '../services/notification.services';

// import {inject} from '@loopback/core';

class Credentials {
  username: string;
  password: string;
}


class ChangePasswordData {
  id: string;
  currentPassword: string;
  newPassword: string;
}

// type of request: 1. SMS, 2. Email
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
    public customerRepository: CustomerRepository,
    @repository(ShoppingCartRepository)
    public shoppingCartRepository: ShoppingCartRepository
  ) {
    this.authService = new AuthService(this.userRepository, shoppingCartRepository);
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Login for users'
      }
    }
  })
  async login(
    @requestBody() credentials: Credentials): Promise<object> {
    let data = await this.authService.Identify(credentials.username, credentials.password);
    if (data) {
      let tk = await this.authService.GenerateToken(data);
      return {
        data: data,
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
    @requestBody() passwordResetData: PasswordResetData): Promise<boolean> {
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
              return true;
            }
            throw new HttpErrors[400]("Phone is not found");
          }
          throw new HttpErrors[401]("User not found");
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
    throw new HttpErrors[401]("User not found");
  }


  @post('/change-password', {
    responses: {
      '200': {
        description: 'Login for users'
      }
    }
  })
  async changePassword(
    @requestBody() data: ChangePasswordData): Promise<boolean> {
    let user = await this.authService.VerifyUserToChangePassword(data.id, data.currentPassword);
    if (user) {
      return await this.authService.ChangePassword(user, data.newPassword);
    } else {
      throw new HttpErrors[401]("User or password invalid.");
    }
  }

}
