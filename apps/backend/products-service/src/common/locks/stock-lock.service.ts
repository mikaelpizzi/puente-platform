import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Product, ProductDocument } from '../../products/schemas/product.schema';

interface StockReservation {
  productId: string;
  quantity: number;
}

/**
 * Stock Lock Service
 *
 * Provides atomic stock operations with optimistic locking
 * to prevent overselling under concurrent purchases.
 *
 * Uses MongoDB's findOneAndUpdate with version checking
 * to ensure only one request can decrement stock at a time.
 */
@Injectable()
export class StockLockService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  /**
   * Atomically decrement stock for a product.
   * Uses optimistic locking with version check.
   *
   * @throws ConflictException if stock was modified by another request
   * @throws BadRequestException if insufficient stock
   */
  async decrementStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductDocument> {
    // First, check current stock
    const product = await this.productModel.findById(productId).session(session || null);

    if (!product) {
      throw new BadRequestException(`Product ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${productId}. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Atomic update with version check
    const updated = await this.productModel.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity }, // Ensure sufficient stock
        __v: product.__v, // Optimistic lock
      },
      {
        $inc: {
          stock: -quantity,
          __v: 1, // Increment version
        },
      },
      {
        new: true,
        session: session || undefined,
      },
    );

    if (!updated) {
      throw new ConflictException(
        'Stock was modified by another request. Please retry your purchase.',
      );
    }

    return updated;
  }

  /**
   * Reserve stock for multiple products atomically.
   * Rolls back all if any fail.
   */
  async reserveStock(reservations: StockReservation[], session?: ClientSession): Promise<void> {
    for (const reservation of reservations) {
      await this.decrementStock(reservation.productId, reservation.quantity, session);
    }
  }

  /**
   * Restore stock (for cancelled orders or refunds).
   */
  async restoreStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity, __v: 1 } },
      { new: true, session: session || undefined },
    );
  }

  /**
   * Check if sufficient stock is available.
   */
  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.productModel.findById(productId).select('stock');
    return product ? product.stock >= quantity : false;
  }
}
