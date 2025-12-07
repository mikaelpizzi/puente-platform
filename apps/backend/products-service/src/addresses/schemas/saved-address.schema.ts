import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SavedAddressDocument = HydratedDocument<SavedAddress>;

/**
 * Common address labels.
 */
export enum AddressLabel {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class SavedAddress {
  /**
   * The user ID this address belongs to.
   */
  @Prop({ required: true, index: true })
  userId!: string;

  /**
   * Label for the address (Home, Work, Other).
   */
  @Prop({ type: String, enum: Object.values(AddressLabel), default: AddressLabel.OTHER })
  label!: AddressLabel;

  /**
   * Custom name for the address (e.g., "Oficina Centro").
   */
  @Prop()
  customName?: string;

  /**
   * Street address.
   */
  @Prop({ required: true })
  street!: string;

  /**
   * City.
   */
  @Prop({ required: true })
  city!: string;

  /**
   * State/Province.
   */
  @Prop({ required: true })
  state!: string;

  /**
   * ZIP/Postal code.
   */
  @Prop()
  zipCode?: string;

  /**
   * Country.
   */
  @Prop({ default: 'Venezuela' })
  country!: string;

  /**
   * Additional details (apartment, floor, etc.).
   */
  @Prop()
  details?: string;

  /**
   * Latitude coordinate (for OSRM routing).
   */
  @Prop({ required: true })
  latitude!: number;

  /**
   * Longitude coordinate (for OSRM routing).
   */
  @Prop({ required: true })
  longitude!: number;

  /**
   * Whether this is the user's default shipping address.
   */
  @Prop({ default: false })
  isDefault!: boolean;

  /**
   * Phone number for this address.
   */
  @Prop()
  phone?: string;

  /**
   * Notes for delivery.
   */
  @Prop()
  deliveryNotes?: string;
}

export const SavedAddressSchema = SchemaFactory.createForClass(SavedAddress);

// Index for fast queries by user
SavedAddressSchema.index({ userId: 1, isDefault: -1 });
