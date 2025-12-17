import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Preference } from 'mercadopago';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private client: MercadoPagoConfig;
  private preference: Preference;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN not found. Payment features will fail.');
    }

    this.client = new MercadoPagoConfig({ accessToken: accessToken || 'dummy_token' });
    this.preference = new Preference(this.client);
  }

  async createPaymentLink(orderId: string, title: string, price: number, quantity: number = 1) {
    try {
      const result = await this.preference.create({
        body: {
          items: [
            {
              id: orderId,
              title: title,
              quantity: quantity,
              unit_price: Number(price),
              currency_id: 'ARS', // Defaulting to ARS for now, should be configurable
            },
          ],
          external_reference: orderId,
          back_urls: {
            success: this.configService.get('PAYMENT_SUCCESS_URL'),
            failure: this.configService.get('PAYMENT_FAILURE_URL'),
            pending: this.configService.get('PAYMENT_PENDING_URL'),
          },
          auto_return: 'approved',
        },
      });

      return {
        id: result.id,
        init_point: result.init_point, // The link for the user to pay
        sandbox_init_point: result.sandbox_init_point,
      };
    } catch (error) {
      this.logger.error(`Error creating payment preference for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Creates a single payment link for multiple orders (Split Orders architecture).
   * Stores all order IDs in external_reference as JSON for webhook processing.
   */
  async createMultiOrderPaymentLink(orderIds: string[], title: string, totalPrice: number) {
    try {
      this.logger.log(`Creating multi-order payment link for orders: ${orderIds.join(', ')}`);

      const result = await this.preference.create({
        body: {
          items: [
            {
              id: orderIds.join(','),
              title: title,
              quantity: 1,
              unit_price: Number(totalPrice),
              currency_id: 'ARS',
            },
          ],
          // CRITICAL: Store all order IDs as JSON for webhook to parse
          external_reference: JSON.stringify({ orderIds, type: 'multi_order' }),
          back_urls: {
            success: this.configService.get('PAYMENT_SUCCESS_URL'),
            failure: this.configService.get('PAYMENT_FAILURE_URL'),
            pending: this.configService.get('PAYMENT_PENDING_URL'),
          },
          auto_return: 'approved',
        },
      });

      this.logger.log(`Multi-order payment preference created: ${result.id}`);

      return {
        id: result.id,
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
      };
    } catch (error) {
      this.logger.error(
        `Error creating multi-order payment preference for orders ${orderIds.join(', ')}`,
        error,
      );
      throw error;
    }
  }
}
