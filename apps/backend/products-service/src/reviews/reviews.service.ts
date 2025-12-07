import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument, ReviewTargetType } from './schemas/review.schema';
import { CreateReviewDto, RespondToReviewDto } from './dto/create-review.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/schemas/order.schema';

/**
 * Interface for review statistics.
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Creates a new review for an order.
   * Validates that the order exists, is delivered, and the reviewer is the buyer.
   */
  async create(dto: CreateReviewDto, reviewerId: string): Promise<Review> {
    // Validate the order exists and is delivered
    const order = await this.ordersService.findOne(dto.orderId);

    // Check that the reviewer is the buyer of the order
    if (order.buyerId !== reviewerId) {
      throw new ForbiddenException('Only the buyer can review this order');
    }

    // Check that the order is delivered
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Can only review delivered orders');
    }

    // Validate target based on targetType
    if (dto.targetType === ReviewTargetType.SELLER && dto.targetId !== order.sellerId) {
      throw new BadRequestException('Invalid seller ID for this order');
    }
    if (dto.targetType === ReviewTargetType.COURIER && dto.targetId !== order.courierId) {
      throw new BadRequestException('Invalid courier ID for this order');
    }

    // Check for existing review (compound index will also enforce this)
    const existing = await this.reviewModel
      .findOne({
        orderId: dto.orderId,
        reviewerId,
        targetType: dto.targetType,
      })
      .exec();

    if (existing) {
      throw new BadRequestException('You have already reviewed this ' + dto.targetType);
    }

    const review = new this.reviewModel({
      ...dto,
      reviewerId,
    });

    return review.save();
  }

  /**
   * Find all reviews for a specific target (seller or courier).
   */
  async findByTarget(
    targetId: string,
    targetType: ReviewTargetType,
    options: { limit?: number; offset?: number } = {},
  ): Promise<Review[]> {
    const { limit = 20, offset = 0 } = options;

    return this.reviewModel
      .find({ targetId, targetType, isVisible: true })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  /**
   * Find all reviews written by a specific user.
   */
  async findByReviewer(reviewerId: string): Promise<Review[]> {
    return this.reviewModel.find({ reviewerId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Get review statistics for a target (average, count, distribution).
   */
  async getStats(targetId: string, targetType: ReviewTargetType): Promise<ReviewStats> {
    const pipeline = [
      { $match: { targetId, targetType, isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' },
        },
      },
    ];

    const result = await this.reviewModel.aggregate(pipeline).exec();

    if (!result.length || !result[0]) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const { averageRating, totalReviews, ratings } = result[0];

    // Calculate distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++;
      }
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingDistribution,
    };
  }

  /**
   * Find a single review by ID.
   */
  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  /**
   * Allow a seller/courier to respond to a review.
   */
  async respondToReview(
    reviewId: string,
    targetId: string,
    dto: RespondToReviewDto,
  ): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    // Check that the responder is the target of the review
    if (review.targetId !== targetId) {
      throw new ForbiddenException('You can only respond to reviews about you');
    }

    // Check if already responded
    if (review.response) {
      throw new BadRequestException('You have already responded to this review');
    }

    review.response = dto.response;
    review.respondedAt = new Date();
    return review.save();
  }

  /**
   * Hide a review (for moderation purposes).
   * Only admins should be able to call this.
   */
  async hideReview(reviewId: string): Promise<Review> {
    const review = await this.reviewModel
      .findByIdAndUpdate(reviewId, { isVisible: false }, { new: true })
      .exec();

    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    return review;
  }
}
