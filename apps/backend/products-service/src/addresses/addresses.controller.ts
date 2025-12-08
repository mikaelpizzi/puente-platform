import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('addresses')
@UseGuards(ServiceAuthGuard, RolesGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * Create a new saved address.
   */
  @Post()
  @Roles(Role.BUYER, Role.ADMIN)
  async create(@Body() createAddressDto: CreateAddressDto, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.create(createAddressDto, userId);
  }

  /**
   * Get all addresses for the current user.
   */
  @Get()
  @Roles(Role.BUYER, Role.ADMIN)
  async findAll(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.findByUser(userId);
  }

  /**
   * Get the default address for the current user.
   */
  @Get('default')
  @Roles(Role.BUYER, Role.ADMIN)
  async getDefault(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.getDefault(userId);
  }

  /**
   * Get a single address by ID.
   */
  @Get(':id')
  @Roles(Role.BUYER, Role.ADMIN)
  async findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.findOne(id, userId);
  }

  /**
   * Update an existing address.
   */
  @Patch(':id')
  @Roles(Role.BUYER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.update(id, userId, updateAddressDto);
  }

  /**
   * Set an address as default.
   */
  @Patch(':id/set-default')
  @Roles(Role.BUYER, Role.ADMIN)
  async setDefault(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    return this.addressesService.setDefault(id, userId);
  }

  /**
   * Delete an address.
   */
  @Delete(':id')
  @Roles(Role.BUYER, Role.ADMIN)
  async delete(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing user context (x-user-id)');
    }
    await this.addressesService.delete(id, userId);
    return { deleted: true };
  }
}
