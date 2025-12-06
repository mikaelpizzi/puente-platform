import { Controller, Get, Post, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';

// Mock Auth Guard - in real app this would extract user from JWT
// For now we trust the x-user-id header or default to 'current-user'
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@Headers('x-user-id') userId: string) {
    const sellerId = userId || 'current-user';
    return this.tagsService.findAll(sellerId);
  }

  @Post()
  async create(
    @Body() body: { name: string; color?: string },
    @Headers('x-user-id') userId: string,
  ) {
    const sellerId = userId || 'current-user';
    return this.tagsService.create(body.name, sellerId, body.color);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    const sellerId = userId || 'current-user';
    return this.tagsService.delete(id, sellerId);
  }
}
