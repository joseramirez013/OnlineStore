import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository, BelongsToAccessor} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {SaleItem, ShoppingCart, ShoppingCartRelations, SaleDocument, Customer} from '../models';
import {SaleItemRepository} from './sale-item.repository';
import {SaleDocumentRepository} from './sale-document.repository';
import {CustomerRepository} from './customer.repository';

export class ShoppingCartRepository extends DefaultCrudRepository<
  ShoppingCart,
  typeof ShoppingCart.prototype.id,
  ShoppingCartRelations
  > {

  public readonly saleItems: HasManyRepositoryFactory<SaleItem, typeof ShoppingCart.prototype.id>;

  public readonly saleDocuments: HasManyRepositoryFactory<SaleDocument, typeof ShoppingCart.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof ShoppingCart.prototype.id>;
  //public readonly customer: BelongsToAccessor<Customer, typeof ShoppingCart.prototype.id>;

  //public readonly saleDocuments: HasManyRepositoryFactory<SaleDocument, typeof ShoppingCart.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('SaleItemRepository') protected saleItemRepositoryGetter: Getter<SaleItemRepository>, @repository.getter('SaleDocumentRepository') protected saleDocumentRepositoryGetter: Getter<SaleDocumentRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(ShoppingCart, dataSource);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.saleDocuments = this.createHasManyRepositoryFactoryFor('saleDocuments', saleDocumentRepositoryGetter,);
    this.registerInclusionResolver('saleDocuments', this.saleDocuments.inclusionResolver);
    this.saleItems = this.createHasManyRepositoryFactoryFor('saleItems', saleItemRepositoryGetter,);
    this.registerInclusionResolver('saleItems', this.saleItems.inclusionResolver);
  }
}
