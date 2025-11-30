import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@Controller('logistics')
@UseGuards(ServiceAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('location')
  async updateLocation(
    @Body('driverId') driverId: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    await this.logisticsService.updateDriverLocation(driverId, lat, lng, 'rest');
    return { success: true };
  }

  @Get('nearby')
  async getNearbyDrivers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.logisticsService.getNearbyDrivers(lat, lng, radius);
  }
}
