import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.financeService.createOrder(dto);
  }

  @Post('orders/:id/compensate')
  compensateOrder(@Param('id') id: string, @Body('reason') reason: string) {
    return this.financeService.compensateOrder(id, reason || 'Saga compensation triggered');
  }
}
