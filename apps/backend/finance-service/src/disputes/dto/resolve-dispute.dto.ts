import { IsString, IsEnum, MinLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsEnum(['buyer', 'seller'])
  winner!: 'buyer' | 'seller';

  @IsString()
  @MinLength(10)
  resolution!: string;
}
