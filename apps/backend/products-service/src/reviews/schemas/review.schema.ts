import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

/**
 * Target type for the review (who is being reviewed).
 */
export enum ReviewTargetType {
  SELLER = 'seller',
  COURIER = 'courier',
}

@Schema({ timestamps: true })
export class Review {
  /**
   * The order ID this review is associated with.
   * A user can only leave one review per order per target type.
   */
  @Prop({ required: true, index: true })
  orderId!: string;

  /**
   * The user ID of the reviewer (buyer).
   */
  @Prop({ required: true, index: true })
  reviewerId!: string;

  /**
   * The user ID of the target (seller or courier).
   */
  @Prop({ required: true, index: true })
  targetId!: string;

  /**
   * The type of target being reviewed.
   */
  @Prop({ type: String, enum: Object.values(ReviewTargetType), required: true })
  targetType!: ReviewTargetType;

  /**
   * Rating from 1 to 5 stars.
   */
  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  /**
   * Optional text comment.
   */
  @Prop()
  comment?: string;

  /**
   * Whether this review is visible (for moderation).
   */
  @Prop({ default: true })
  isVisible!: boolean;

  /**
   * Optional response from the target (seller/courier).
   */
  @Prop()
  response?: string;

  /**
   * When the response was added.
   */
  @Prop()
  respondedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound unique index: one review per order per target type per reviewer
ReviewSchema.index({ orderId: 1, reviewerId: 1, targetType: 1 }, { unique: true });

// Index for fast average/count queries per target
ReviewSchema.index({ targetId: 1, targetType: 1, isVisible: 1 });
