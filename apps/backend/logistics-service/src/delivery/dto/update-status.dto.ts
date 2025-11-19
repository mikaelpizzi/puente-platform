import { IsEnum, IsNotEmpty } from 'class-validator';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;
}
