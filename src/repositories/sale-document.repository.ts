import {DefaultCrudRepository} from '@loopback/repository';
import {SaleDocument, SaleDocumentRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class SaleDocumentRepository extends DefaultCrudRepository<
  SaleDocument,
  typeof SaleDocument.prototype.id,
  SaleDocumentRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(SaleDocument, dataSource);
  }
}
