import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@Controller('finance')
@UseGuards(ServiceAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.financeService.createOrder(dto);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    try {
      return await this.financeService.getOrder(id);
    } catch (error: any) {
      throw new HttpException(error.message || 'Order not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('orders/:id/payment')
  async generatePayment(@Param('id') id: string) {
    try {
      return await this.financeService.generatePaymentForOrder(id);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('orders/:id/compensate')
  compensateOrder(@Param('id') id: string, @Body('reason') reason: string) {
    return this.financeService.compensateOrder(id, reason || 'Saga compensation triggered');
  }

  @Post('dev/fund')
  async addFunds(@Body() body: { userId: string; amount: number }) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Not available in production', HttpStatus.FORBIDDEN);
    }
    return this.financeService.addFunds(body.userId, body.amount);
  }
}
