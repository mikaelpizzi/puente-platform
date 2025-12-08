import { IsString, IsEnum, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  orderId!: string;

  @IsEnum([
    'ITEM_NOT_RECEIVED',
    'ITEM_NOT_AS_DESCRIBED',
    'ITEM_DAMAGED',
    'WRONG_ITEM',
    'QUALITY_ISSUE',
    'OTHER',
  ])
  reason!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence?: string[];
}
