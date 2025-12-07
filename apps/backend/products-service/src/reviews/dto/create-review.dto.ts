import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, MaxLength } from 'class-validator';
import { ReviewTargetType } from '../schemas/review.schema';

/**
 * DTO for creating a new review.
 */
export class CreateReviewDto {
  @IsString()
  orderId!: string;

  @IsString()
  targetId!: string;

  @IsEnum(ReviewTargetType)
  targetType!: ReviewTargetType;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

/**
 * DTO for responding to a review (by seller/courier).
 */
export class RespondToReviewDto {
  @IsString()
  @MaxLength(500)
  response!: string;
}
