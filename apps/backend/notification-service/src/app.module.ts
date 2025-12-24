import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { EventsModule } from './events/events.module';
import { ChannelsModule } from './channels/channels.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Structured logging with nestjs-pino
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
    // Global config module
    ConfigModule.forRoot({ isGlobal: true }),
    // Feature modules
    EventsModule,
    ChannelsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
