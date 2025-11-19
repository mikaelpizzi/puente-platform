import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StockItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}

export class StockOperationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  items!: StockItemDto[];
}
