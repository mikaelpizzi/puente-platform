import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
  Logger,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { FinanceService } from '../finance/finance.service';

/**
 * MercadoPago Payment Webhook Controller
 *
 * Receives payment notifications from MercadoPago and updates orders.
 * NOTE: This endpoint is PUBLIC (no auth guard) as MercadoPago needs to call it.
 *
 * In production, the webhook signature is verified using HMAC-SHA256.
 */
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly financeService: FinanceService,
    private readonly configService: ConfigService,
  ) {
    // Get the webhook secret from environment variables
    // This is configured in MercadoPago developer panel -> Webhooks -> Your integrations
    this.webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');

    if (!this.webhookSecret) {
      this.logger.warn('MERCADOPAGO_WEBHOOK_SECRET not set - signature verification disabled');
    }
  }

  /**
   * Verifies the MercadoPago webhook signature.
   *
   * The x-signature header contains: ts=<timestamp>,v1=<hash>
   * The hash is computed as HMAC-SHA256 of: id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
   *
   * @see https://www.mercadopago.com.mx/developers/es/docs/subscriptions/additional-content/notifications/webhooks
   */
  private verifySignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string | undefined,
  ): boolean {
    if (!this.webhookSecret) {
      // Skip verification if no secret configured (development mode)
      return true;
    }

    if (!xSignature) {
      this.logger.warn('Missing x-signature header');
      return false;
    }

    try {
      // Parse x-signature: ts=xxxx,v1=yyyy
      const parts = xSignature.split(',');
      let ts: string | undefined;
      let v1: string | undefined;

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') v1 = value;
      }

      if (!ts || !v1) {
        this.logger.warn('Invalid x-signature format');
        return false;
      }

      // Build the manifest string: id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
      // Omit any part that is not present
      let manifest = '';
      if (dataId) manifest += `id:${dataId};`;
      if (xRequestId) manifest += `request-id:${xRequestId};`;
      manifest += `ts:${ts};`;

      // Generate HMAC-SHA256
      const generatedHash = createHmac('sha256', this.webhookSecret).update(manifest).digest('hex');

      // Compare hashes
      const isValid = generatedHash === v1;

      if (!isValid) {
        this.logger.warn(`Signature verification failed. Expected: ${v1}, Got: ${generatedHash}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * MercadoPago IPN (Instant Payment Notification) endpoint.
   * Receives notifications when payment status changes.
   */
  @Post('mercadopago')
  @HttpCode(200) // MercadoPago expects 200 OK response
  async handleMercadoPagoWebhook(
    @Body() body: MercadoPagoWebhookPayload,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Query('data.id') queryDataId: string | undefined,
  ) {
    this.logger.log(`Received MercadoPago webhook: ${JSON.stringify(body)}`);

    // Verify signature in production
    const dataId = queryDataId || body.data?.id;
    if (!this.verifySignature(xSignature, xRequestId, dataId)) {
      this.logger.error('Webhook signature verification failed');
      // Return 200 to avoid retries, but log the security issue
      // In production, you might want to throw ForbiddenException
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    // MercadoPago sends different notification types
    if (body.type === 'payment' && body.data?.id) {
      try {
        // In a real implementation, you would fetch the payment details from MercadoPago API
        // to verify the payment status and get the external_reference

        const paymentId = body.data.id;
        this.logger.log(`Processing payment notification for payment ID: ${paymentId}`);

        // The external_reference should be fetched from MercadoPago API using the payment ID
        // For testing/mock purposes, we can receive it directly
        if (body.external_reference) {
          await this.financeService.handlePaymentConfirmation(body.external_reference);
          return { success: true, processed: true };
        }

        // In production: Fetch payment details from MercadoPago API
        // const payment = await mercadopagoClient.payment.get({ id: paymentId });
        // if (payment.status === 'approved') {
        //   await this.financeService.handlePaymentConfirmation(payment.external_reference);
        // }

        return { success: true, queued: true };
      } catch (error: any) {
        this.logger.error(`Error processing payment webhook: ${error.message}`, error.stack);
        // Still return 200 to avoid MercadoPago retrying
        return { success: false, error: error.message };
      }
    }

    return { success: true, ignored: true };
  }

  /**
   * Test endpoint for manual payment confirmation (development only).
   * Accepts the external_reference directly.
   */
  @Post('payment/confirm')
  @HttpCode(200)
  async confirmPaymentManually(@Body() body: { externalReference: string }) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Not available in production' };
    }

    this.logger.log(`Manual payment confirmation for: ${body.externalReference}`);

    try {
      await this.financeService.handlePaymentConfirmation(body.externalReference);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// MercadoPago webhook payload types
interface MercadoPagoWebhookPayload {
  id?: number;
  live_mode?: boolean;
  type?: 'payment' | 'merchant_order' | 'test';
  date_created?: string;
  user_id?: number;
  api_version?: string;
  action?: string;
  data?: {
    id?: string;
  };
  // For testing/mock purposes
  external_reference?: string;
}
