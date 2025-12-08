import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedAddress, SavedAddressDocument } from './schemas/saved-address.schema';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(@InjectModel(SavedAddress.name) private addressModel: Model<SavedAddressDocument>) {}

  /**
   * Create a new saved address for a user.
   */
  async create(dto: CreateAddressDto, userId: string): Promise<SavedAddress> {
    // If setting as default, unset any existing default
    if (dto.isDefault) {
      await this.addressModel.updateMany({ userId, isDefault: true }, { isDefault: false }).exec();
    }

    const address = new this.addressModel({
      ...dto,
      userId,
    });

    return address.save();
  }

  /**
   * Find all addresses for a user.
   */
  async findByUser(userId: string): Promise<SavedAddress[]> {
    return this.addressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  /**
   * Find a single address by ID.
   */
  async findOne(id: string, userId: string): Promise<SavedAddress> {
    const address = await this.addressModel.findOne({ _id: id, userId }).exec();
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    return address;
  }

  /**
   * Get the user's default address.
   */
  async getDefault(userId: string): Promise<SavedAddress | null> {
    return this.addressModel.findOne({ userId, isDefault: true }).exec();
  }

  /**
   * Update an existing address.
   */
  async update(id: string, userId: string, dto: UpdateAddressDto): Promise<SavedAddress> {
    // If setting as default, unset any existing default
    if (dto.isDefault) {
      await this.addressModel
        .updateMany({ userId, isDefault: true, _id: { $ne: id } }, { isDefault: false })
        .exec();
    }

    const address = await this.addressModel
      .findOneAndUpdate({ _id: id, userId }, dto, { new: true })
      .exec();

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  /**
   * Set an address as the default.
   */
  async setDefault(id: string, userId: string): Promise<SavedAddress> {
    // Unset any existing default
    await this.addressModel.updateMany({ userId, isDefault: true }, { isDefault: false }).exec();

    // Set the new default
    const address = await this.addressModel
      .findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { new: true })
      .exec();

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  /**
   * Delete an address.
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.addressModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
  }

  /**
   * Get count of addresses for a user.
   */
  async count(userId: string): Promise<number> {
    return this.addressModel.countDocuments({ userId }).exec();
  }
}
