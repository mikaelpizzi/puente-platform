import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  /**
   * Creates a new product.
   * @param createProductDto - The data to create the product.
   * @returns The created Product document.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  /**
   * Retrieves all products.
   * @returns An array of Product documents.
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Retrieves a single product by ID.
   * @param id - The ID of the product.
   * @returns The Product document.
   * @throws NotFoundException - If the product is not found.
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  /**
   * Updates a product by ID.
   * @param id - The ID of the product.
   * @param updateProductDto - The data to update.
   * @returns The updated Product document.
   * @throws NotFoundException - If the product is not found.
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return updatedProduct;
  }

  /**
   * Removes a product by ID.
   * @param id - The ID of the product.
   * @returns The deleted Product document.
   * @throws NotFoundException - If the product is not found.
   */
  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return deletedProduct;
  }

  /**
   * Reserves stock for a list of items.
   * @param items - Array of items with productId and quantity.
   * @returns True if reservation is successful.
   * @throws NotFoundException - If a product is not found.
   * @throws BadRequestException - If stock is insufficient or concurrent update fails.
   */
  async reserveStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
    const reservedItems: { productId: string; quantity: number }[] = [];

    try {
      for (const item of items) {
        const product = await this.productModel.findById(item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        // Check available stock (stock - reservedStock)
        if (product.stock - product.reservedStock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
        }

        // Atomically increment reservedStock if condition is met
        const updated = await this.productModel.findOneAndUpdate(
          {
            _id: item.productId,
            // Ensure we don't over-reserve in case of race condition
            $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, item.quantity] },
          },
          { $inc: { reservedStock: item.quantity } },
          { new: true },
        );

        if (!updated) {
          throw new BadRequestException(
            `Failed to reserve stock for product ${item.productId} due to concurrent updates`,
          );
        }
        reservedItems.push(item);
      }
      return true;
    } catch (error) {
      // Rollback
      await this.releaseStock(reservedItems);
      throw error;
    }
  }

  /**
   * Releases reserved stock for a list of items.
   * @param items - Array of items with productId and quantity.
   * @returns void
   */
  async releaseStock(items: { productId: string; quantity: number }[]): Promise<void> {
    for (const item of items) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { reservedStock: -item.quantity },
      });
    }
  }

  /**
   * Confirms stock deduction (completes a sale).
   * @param items - Array of items with productId and quantity.
   * @returns void
   */
  async confirmStock(items: { productId: string; quantity: number }[]): Promise<void> {
    for (const item of items) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, reservedStock: -item.quantity },
      });
    }
  }
}
