import {
  AuthenticationBindings,
  AuthenticationMetadata
} from '@loopback/authentication';
import {inject, Provider, ValueOrPromise} from '@loopback/context';
import {repository} from '@loopback/repository';
import {Strategy} from 'passport';
import {BasicStrategy} from 'passport-http';
import {Strategy as BearerStrategy} from 'passport-http-bearer';
import {UserRepository} from '../repositories';
import {AuthService} from '../services/auth.services';


export class MyAuthStrategyProvider implements Provider<Strategy | undefined> {
  authService: AuthService;

  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
    @repository(UserRepository)
    public userRepository: UserRepository
  ) {
    this.authService = new AuthService(userRepository);
  }

  value(): ValueOrPromise<Strategy | undefined> {
    // The function was not decorated, so we shouldn't attempt authentication
    if (!this.metadata) {
      return undefined;
    }

    const name = this.metadata.strategy;
    switch (name) {
      case 'BasicStrategy':
        return new BasicStrategy(this.VerifyUser.bind(this));
      case 'TokenAdminStrategy':
        return new BearerStrategy(this.VerifyAdminToken.bind(this));
      case 'TokenCustomerStrategy':
        return new BearerStrategy(this.VerifyCustomerToken.bind(this));
      default:
        return Promise.reject(`The strategy ${name} is not available.`);
        break;
    }
  }

  VerifyUser(
    username: string,
    password: string,
    cb: (err: Error | null, user?: Object | false) => void,
  ) {
    let user = this.authService.Identify(username, password);
    return cb(null, user);
  }

  VerifyAdminToken(
    token: string,
    cb: (err: Error | null, user?: Object | false) => void,
  ) {
    this.authService.VerifyToken(token).then(data => {
      if (data && data.role == 2) {
        return cb(null, data);
      }
      return cb(null, false);
    });
  }

  VerifyCustomerToken(
    token: string,
    cb: (err: Error | null, user?: Object | false) => void,
  ) {
    this.authService.VerifyToken(token).then(data => {
      if (data && data.role == 1) {
        return cb(null, data);
      }
      return cb(null, false);
    });
  }
}
