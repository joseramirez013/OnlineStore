import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param,


  patch, post,




  put,

  requestBody
} from '@loopback/rest';
import {generate} from 'generate-password';
import {PasswordKeys} from '../keys/password-keys';
import {ServiceKeys as keys} from '../keys/service-keys';
import {Customer, ShoppingCart} from '../models';
import {EmailNotification} from '../models/email-notification.model';
import {CustomerRepository, ShoppingCartRepository, UserRepository} from '../repositories';
import {AuthService} from '../services/auth.services';
import {EncryptDecrypt} from '../services/encrypt-decryp-service';
import {NotificationService} from '../services/notification.services';

export class CustomerController {
  authService: AuthService;

  constructor(
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(ShoppingCartRepository)
    public shoppingCartRepository: ShoppingCartRepository
  ) {
    this.authService = new AuthService(this.userRepository, shoppingCartRepository);
  }

  @post('/customer', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {'application/json': {schema: getModelSchemaRef(Customer)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {
            title: 'NewCustomer',
            exclude: ['id'],
          }),
        },
      },
    })
    customer: Omit<Customer, 'id'>,
  ): Promise<Customer> {
    let userExits = await this.customerRepository.findOne({where: {document: customer.document}})
    if (userExits) {
      throw new HttpErrors[403];
    }
    let c = await this.customerRepository.create(customer);
    let randomPassword = generate({
      length: PasswordKeys.LENGTH,
      numbers: PasswordKeys.NUMBERS,
      lowercase: PasswordKeys.LOWERCASE,
      uppercase: PasswordKeys.UPPERCASE
    });
    let password1 = new EncryptDecrypt(keys.MD5).Encrypt(randomPassword);
    let password2 = new EncryptDecrypt(keys.MD5).Encrypt(password1);
    let u = {
      username: c.document,
      password: password2,
      role: 1,
      customerId: c.id
    };
    let user = await this.userRepository.create(u);

    /**
     * Customer Shopping cart creation
     */
    let shoppingCart = new ShoppingCart({
      code: `${this.authService.GenerateRandomPassword()}-${Date.now()}`, //Codigo
      createdDate: new Date(), //Fecha actual
      customerId: c.id //Customer Id
    });
    await this.shoppingCartRepository.create(shoppingCart); //Crear carrito de compras del cliente


    let notification = new EmailNotification({
      textBody: `Hola ${c.name} ${c.lastname}, se ha creado una cuenta a su nombre, su usario es su documento de identidad y su contraseña es: ${randomPassword}`,
      htmlBody: `Hola ${c.name} ${c.lastname}, <br /> se ha creado una cuenta a su nombre, su usario es su documento de identidad y su contraseña es: <strong>${randomPassword}</strong>`,
      to: c.email,
      subject: 'Nueva cuenta'
    });
    await new NotificationService().MailNotification(notification);
    user.password = '';
    c.user = user;
    return c;
  }

  @get('/customer/count', {
    responses: {
      '200': {
        description: 'Customer model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Customer) where?: Where<Customer>,
  ): Promise<Count> {
    return this.customerRepository.count(where);
  }

  @get('/customer', {
    responses: {
      '200': {
        description: 'Array of Customer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Customer, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Customer) filter?: Filter<Customer>,
  ): Promise<Customer[]> {
    return this.customerRepository.find(filter);
  }

  @patch('/customer', {
    responses: {
      '200': {
        description: 'Customer PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {partial: true}),
        },
      },
    })
    customer: Customer,
    @param.where(Customer) where?: Where<Customer>,
  ): Promise<Count> {
    return this.customerRepository.updateAll(customer, where);
  }

  @get('/customer/{id}', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Customer, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Customer, {exclude: 'where'}) filter?: FilterExcludingWhere<Customer>
  ): Promise<Customer> {
    return this.customerRepository.findById(id, filter);
  }

  @patch('/customer/{id}', {
    responses: {
      '204': {
        description: 'Customer PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {partial: true}),
        },
      },
    })
    customer: Customer,
  ): Promise<void> {
    await this.customerRepository.updateById(id, customer);
  }

  @put('/customer/{id}', {
    responses: {
      '204': {
        description: 'Customer PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() customer: Customer,
  ): Promise<void> {

    let u = await this.userRepository.findOne({where: {customerId: customer.id}});
    if (u) {
      u.username = customer.document;
      await this.userRepository.replaceById(u.id, u);
    }
    await this.customerRepository.replaceById(id, customer);

  }

  @del('/customer/{id}', {
    responses: {
      '204': {
        description: 'Customer DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.customerRepository.deleteById(id);
  }
}
