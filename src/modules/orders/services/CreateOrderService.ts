import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
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
    const findCustomer = await this.customersRepository.findById(customer_id);

    if (!findCustomer) {
      throw new AppError('Customer not found');
    }

    // NOTE - Remove validation logic from the update Quantity method
    const updatedProducts = await this.productsRepository.updateQuantity(
      products,
    );

    const orderProducts = updatedProducts.map(product => {
      // NOTE - Remove this logic of calculating the quantity
      const quantity =
        products.find(p => p.id === product.id)?.quantity || product.quantity;

      return {
        product_id: product.id,
        price: product.price,
        quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
