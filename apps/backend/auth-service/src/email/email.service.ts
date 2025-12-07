import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;
  private readonly appName: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('SMTP_FROM') || 'noreply@puente.app';
    this.appName = this.configService.get<string>('APP_NAME') || 'Puente';

    // Configure Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.configService.get<string>('SMTP_PORT') || 587),
      secure: false, // TLS
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'), // App password for Gmail
      },
    });

    this.logger.log('Email service initialized with Gmail SMTP');
  }

  /**
   * Sends an email using the configured transporter.
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.appName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`Email sent successfully: ${info.messageId} to ${options.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${options.to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sends a welcome email to a newly registered user.
   */
  async sendWelcome(email: string, name: string): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a ${this.appName}!</h1>
          </div>
          <div class="content">
            <p>Hola ${name || 'Usuario'},</p>
            <p>Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a explorar nuestra plataforma.</p>
            <p>Con ${this.appName} puedes:</p>
            <ul>
              <li>Comprar y vender productos de forma segura</li>
              <li>Realizar pagos con criptomonedas (USDT)</li>
              <li>Rastrear tus pedidos en tiempo real</li>
            </ul>
            <a href="${this.configService.get('APP_URL') || 'http://localhost:5173'}" class="button">Ir a ${this.appName}</a>
            <p>¡Gracias por unirte!</p>
            <p>El equipo de ${this.appName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `¡Bienvenido a ${this.appName}!`,
      html,
    });
  }

  /**
   * Sends an email verification link.
   */
  async sendVerification(email: string, token: string): Promise<EmailResult> {
    const verifyUrl = `${this.configService.get('APP_URL') || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .code { font-family: monospace; background: #e0e0e0; padding: 2px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verifica tu correo</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Haz clic en el siguiente botón para verificar tu dirección de correo electrónico:</p>
            <a href="${verifyUrl}" class="button">Verificar Correo</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all;"><small>${verifyUrl}</small></p>
            <p>Este enlace expira en 24 horas.</p>
            <p>Si no creaste una cuenta, ignora este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `Verifica tu correo - ${this.appName}`,
      html,
    });
  }

  /**
   * Sends a password reset link.
   */
  async sendPasswordReset(email: string, token: string): Promise<EmailResult> {
    const resetUrl = `${this.configService.get('APP_URL') || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperar Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón:</p>
            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all;"><small>${resetUrl}</small></p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, ignora este mensaje.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `Recuperar contraseña - ${this.appName}`,
      html,
    });
  }

  /**
   * Strips HTML tags for plain text version of emails.
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
