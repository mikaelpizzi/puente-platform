import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
