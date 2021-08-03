import {repository} from '@loopback/repository';
import {generate as generator} from 'generate-password';
import {PasswordKeys as passKeys} from '../keys/password-keys';
import {ServiceKeys as keys} from '../keys/service-keys';
import {AuthenticatedUser, User} from '../models';
import {ShoppingCartRepository, UserRepository} from '../repositories';
import {EncryptDecrypt} from './encrypt-decryp-service';
const jwt = require("jsonwebtoken");

export class AuthService {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(ShoppingCartRepository)
    public cartRepository: ShoppingCartRepository) { }

  /**
   *
   * @param username
   * @param password
   */

  async Identify(username: string, password: string): Promise<AuthenticatedUser | false> {
    let user = await this.userRepository.findOne({where: {username: username}})
    if (user) {
      let cryptPass = new EncryptDecrypt(keys.LOGIN_CRYPT_METHOD).Encrypt(password);
      if (user.password == cryptPass) {
        let cart = await this.cartRepository.findOne({where: {customerId: user.customerId}})
        return new AuthenticatedUser({
          id: user.id,
          cartId: cart?.id,
          customerId: user.customerId,
          role: user.role,
          username: user.username
        });
      }
    }
    return false;
  }
  async VerifyUserToChangePassword(id: string, currentPassword: string): Promise<User | false> {
    let user = await this.userRepository.findById(id);
    if (user) {
      let cryptPass = new EncryptDecrypt(keys.LOGIN_CRYPT_METHOD).Encrypt(currentPassword);
      if (user.password == cryptPass) {
        return user;
      }
    }
    return false;
  }

  async ChangePassword(user: User, newPassword: string): Promise<boolean> {
    try {
      let encryptPass = new EncryptDecrypt(keys.LOGIN_CRYPT_METHOD).Encrypt(newPassword);
      user.password = encryptPass;
      await this.userRepository.updateById(user.id, user);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
 * It generates a random password
 */
  async GenerateRandomPassword() {
    let randomPassword = generator({
      length: passKeys.LENGTH,
      numbers: passKeys.NUMBERS,
      uppercase: passKeys.UPPERCASE,
      lowercase: passKeys.LOWERCASE
    });
    return randomPassword;
  }

  /**
   *
   * @param user
   */
  async GenerateToken(user: AuthenticatedUser) {
    //user.password = '';
    let token = jwt.sign({
      exp: keys.TOKEN_EXPIRATION_TIME,
      data: {
        _id: user.id,
        username: user.username,
        role: user.role,
        paternId: user.customerId,
        cartId: user.cartId
      }
    },
      keys.JWT_SECRET_KEY);
    return token;
  }

  /**
   * To verify a given token
   * @param token
   */
  async VerifyToken(token: string) {
    try {
      //console.log("Token in VerifyToken: " + token);
      let data = jwt.verify(token, keys.JWT_SECRET_KEY);
      //console.log("data verifying");
      //console.log(data);
      return data;
    } catch (error) {
      //console.log(error);
      return false;
    }
  }

  /**
   * Reset the user password when it is missed
   * @param username
   */
  async ResetPassword(username: string): Promise<string | false> {
    let user = await this.userRepository.findOne({where: {username: username}});
    if (user) {
      let randomPassword = generator({
        length: passKeys.LENGTH,
        numbers: passKeys.NUMBERS,
        lowercase: passKeys.LOWERCASE,
        uppercase: passKeys.UPPERCASE
      });
      let crypter = new EncryptDecrypt(keys.LOGIN_CRYPT_METHOD);
      let password = crypter.Encrypt(crypter.Encrypt(randomPassword));
      user.password = password;
      this.userRepository.replaceById(user.id, user);
      return randomPassword;
    }
    return false;
  }

}
