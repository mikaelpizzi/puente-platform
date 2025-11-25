import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  vertical!: string;

  @IsObject()
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>;

  @IsString()
  @IsOptional()
  sellerId?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;
}
