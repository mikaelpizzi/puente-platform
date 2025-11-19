import { Controller, Post, Body, Patch, Param, Get, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@Controller('deliveries')
@UseGuards(ServiceAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryService.getDelivery(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.deliveryService.updateStatus(id, dto);
  }

  @Patch(':id/assign')
  assignDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.deliveryService.assignDriver(id, driverId);
  }

  @Get(':id/tracking')
  getTrackingLink(@Param('id') id: string) {
    return { url: this.deliveryService.generateTrackingLink(id) };
  }
}
