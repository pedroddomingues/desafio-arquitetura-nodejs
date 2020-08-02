import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer is not correct');
    }

    const productsObj = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );

    if (productsObj.length < products.length) {
      throw new AppError('One or more products are invalid.');
    }

    productsObj.forEach((product, index) => {
      if (product.quantity < products[index].quantity) {
        throw new AppError(
          `Product ${product.name} has only ${product.quantity} units available`,
        );
      }
    });

    const productsOK = productsObj.map((productObj: Product, index) => ({
      product_id: productObj.id,
      price: productObj.price,
      quantity: products[index].quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: productsOK,
    });

    await this.productsRepository.updateQuantity(
      productsOK.map(product => ({
        id: product.product_id,
        quantity: product.quantity,
      })),
    );

    return order;
  }
}

export default CreateOrderService;
