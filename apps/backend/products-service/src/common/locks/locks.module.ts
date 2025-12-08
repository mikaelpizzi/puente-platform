import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockLockService } from './stock-lock.service';
import { Product, ProductSchema } from '../../products/schemas/product.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  providers: [StockLockService],
  exports: [StockLockService],
})
export class LocksModule {}
