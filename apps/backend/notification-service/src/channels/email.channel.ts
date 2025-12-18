import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email Channel
 *
 * Sends emails using Nodemailer.
 * Supports dual mode:
 * - Cloud (Resend): Uses SMTP auth with MAIL_USER/MAIL_PASSWORD
 * - Local (MailHog): No auth required, uses MAIL_HOST:MAIL_PORT
 */
@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.MAIL_HOST || 'localhost';
    const port = parseInt(process.env.MAIL_PORT || '1025', 10);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;

    // Determine if we're in cloud mode (has auth credentials)
    const isCloudMode = user && pass;

    const transportConfig: nodemailer.TransportOptions = {
      host,
      port,
      secure: port === 465, // SSL for port 465 (Resend)
    } as nodemailer.TransportOptions;

    // Only add auth if credentials are provided (cloud mode)
    if (isCloudMode) {
      (transportConfig as any).auth = { user, pass };
      this.logger.log(`📧 Email channel initialized (Cloud mode: ${host}:${port})`);
    } else {
      this.logger.log(`📧 Email channel initialized (Local mode: ${host}:${port} - no auth)`);
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email channel not configured, skipping');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@puente.app',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      this.logger.debug(`Email sent to ${payload.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}:`, error);
      return false;
    }
  }

  /**
   * Generate HTML email template.
   */
  static template(title: string, message: string, actionUrl?: string, actionText?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 32px; }
          .content h2 { color: #1f2937; margin-top: 0; }
          .content p { color: #4b5563; line-height: 1.6; }
          .button { display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 16px; }
          .footer { background: #f9fafb; padding: 16px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌉 Puente</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText || 'Ver Detalles'}</a>` : ''}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Puente Platform. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
