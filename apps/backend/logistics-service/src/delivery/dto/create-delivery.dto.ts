import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateDeliveryDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation: LocationDto;

  @IsString()
  @IsOptional()
  driverId?: string;
}
