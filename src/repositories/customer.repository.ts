import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Customer, CustomerRelations, ShoppingCart, User} from '../models';
import {ShoppingCartRepository} from './shopping-cart.repository';
import {UserRepository} from './user.repository';

export class CustomerRepository extends DefaultCrudRepository<
  Customer,
  typeof Customer.prototype.id,
  CustomerRelations
  > {

  public readonly shoppingCart: HasOneRepositoryFactory<ShoppingCart, typeof Customer.prototype.id>;

  public readonly user: HasOneRepositoryFactory<User, typeof Customer.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('ShoppingCartRepository') protected shoppingCartRepositoryGetter: Getter<ShoppingCartRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Customer, dataSource);
    this.user = this.createHasOneRepositoryFactoryFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.shoppingCart = this.createHasOneRepositoryFactoryFor('shoppingCart', shoppingCartRepositoryGetter);
    this.registerInclusionResolver('shoppingCart', this.shoppingCart.inclusionResolver);

  }
}
