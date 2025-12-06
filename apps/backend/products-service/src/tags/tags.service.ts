import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag } from './schemas/tag.schema';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<Tag>) {}

  async findAll(sellerId: string): Promise<Tag[]> {
    return this.tagModel.find({ sellerId }).sort({ name: 1 }).exec();
  }

  async create(name: string, sellerId: string, color?: string): Promise<Tag> {
    const count = await this.tagModel.countDocuments({ sellerId });
    if (count >= 30) {
      throw new ConflictException('Maximum limit of 30 tags reached');
    }

    try {
      const newTag = new this.tagModel({
        name: name.trim(),
        sellerId,
        color: color || 'emerald',
      });
      return await newTag.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Tag already exists for this seller');
      }
      throw error;
    }
  }

  async delete(id: string, sellerId: string): Promise<void> {
    await this.tagModel.deleteOne({ _id: id, sellerId }).exec();
  }
}
