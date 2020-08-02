import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
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
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    if (!product) {
      return undefined;
    }

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsFound = await this.ormRepository.findByIds(products);

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids = products.map(item => item.id);

    const productsFound = await this.ormRepository.findByIds(ids);

    productsFound.forEach((product, index) => {
      product.quantity -= products[index].quantity;
    });

    const productsFinal = await this.ormRepository.save(productsFound);

    return productsFinal;
  }
}

export default ProductsRepository;
