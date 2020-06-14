import { getRepository, Repository } from 'typeorm';

import AppError from '@shared/errors/AppError';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = await this.ormRepository.findByIds([...products]);

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = products.map(product => product.id);

    const findProducts = await this.ormRepository.findByIds(ids);

    if (ids.length !== findProducts.length) {
      throw new AppError('Products invalid');
    }

    const subtractedProducts = findProducts.map(findProduct => {
      const currentProduct = products.find(
        product => product.id === findProduct.id,
      );

      if (!currentProduct) {
        throw new AppError('Product not found');
      }

      if (findProduct.quantity < currentProduct.quantity) {
        throw new AppError('Insufficient quantity');
      }

      const newQuantity = findProduct.quantity - currentProduct.quantity;
      return { ...findProduct, quantity: newQuantity };
    });

    const updatedProducts = await this.ormRepository.save(subtractedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
