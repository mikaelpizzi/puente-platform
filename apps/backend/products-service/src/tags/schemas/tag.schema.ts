import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  sellerId!: string;

  @Prop({ default: 'emerald' })
  color!: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

// Compound index to ensure unique tag names per seller
TagSchema.index({ sellerId: 1, name: 1 }, { unique: true });
