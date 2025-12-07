import { IsString, IsOptional, IsNumber, Min, Max, ValidateIf } from 'class-validator';

/**
 * DTO for completing a delivery with Proof of Delivery (POD).
 * Either photoBase64 or signatureBase64 must be provided.
 */
export class CompleteDeliveryDto {
  @IsOptional()
  @IsString()
  photoBase64?: string; // Base64 encoded photo from camera

  @IsOptional()
  @IsString()
  signatureBase64?: string; // Base64 encoded signature from canvas

  @IsOptional()
  @IsString()
  notes?: string; // Optional delivery notes

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number; // GPS latitude at delivery

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number; // GPS longitude at delivery

  /**
   * Validate that at least one of photoBase64 or signatureBase64 is provided.
   * This is handled in the service layer for better error messaging.
   */
}
