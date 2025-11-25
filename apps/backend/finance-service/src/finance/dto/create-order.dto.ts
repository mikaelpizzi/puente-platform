import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}

export class CreateOrderDto {
  @IsString()
  sellerId!: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  sagaId?: string;
}
