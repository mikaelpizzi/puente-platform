import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true })
  vertical!: string; // e.g., 'food', 'electronics', 'pharmacy'

  // Flexible attributes for multi-vertical support
  @Prop({ type: MongooseSchema.Types.Mixed })
  attributes!: Record<string, any>;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ required: true })
  sellerId!: string; // Reference to the seller in auth-service

  @Prop({ default: 0, min: 0 })
  stock!: number;

  @Prop({ default: 0, min: 0 })
  reservedStock!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
