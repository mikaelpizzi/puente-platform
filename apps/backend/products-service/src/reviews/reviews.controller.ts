import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondToReviewDto } from './dto/create-review.dto';
import { ReviewTargetType } from './schemas/review.schema';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('reviews')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Create a new review.
   * Only buyers can create reviews for delivered orders.
   */
  @Post()
  @Roles(Role.BUYER, Role.ADMIN)
  async create(@Body() createReviewDto: CreateReviewDto, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.reviewsService.create(createReviewDto, userId);
  }

  /**
   * Get reviews for a seller.
   */
  @Get('seller/:sellerId')
  async getSellerReviews(
    @Param('sellerId') sellerId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewsService.findByTarget(sellerId, ReviewTargetType.SELLER, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get reviews for a courier.
   */
  @Get('courier/:courierId')
  async getCourierReviews(
    @Param('courierId') courierId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewsService.findByTarget(courierId, ReviewTargetType.COURIER, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get review statistics for a seller.
   */
  @Get('seller/:sellerId/stats')
  async getSellerStats(@Param('sellerId') sellerId: string) {
    return this.reviewsService.getStats(sellerId, ReviewTargetType.SELLER);
  }

  /**
   * Get review statistics for a courier.
   */
  @Get('courier/:courierId/stats')
  async getCourierStats(@Param('courierId') courierId: string) {
    return this.reviewsService.getStats(courierId, ReviewTargetType.COURIER);
  }

  /**
   * Get reviews written by the current user.
   */
  @Get('my-reviews')
  @Roles(Role.BUYER, Role.ADMIN)
  async getMyReviews(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.reviewsService.findByReviewer(userId);
  }

  /**
   * Get a single review by ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  /**
   * Respond to a review.
   * Only the target (seller/courier) can respond.
   */
  @Patch(':id/respond')
  @Roles(Role.SELLER, Role.COURIER, Role.ADMIN)
  async respond(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() respondDto: RespondToReviewDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.reviewsService.respondToReview(id, userId, respondDto);
  }

  /**
   * Hide a review (moderation).
   * Only admins can hide reviews.
   */
  @Patch(':id/hide')
  @Roles(Role.ADMIN)
  async hide(@Param('id') id: string) {
    return this.reviewsService.hideReview(id);
  }
}
