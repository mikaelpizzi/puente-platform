import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env', '../../../.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('PRODUCTS_MONGO_URI') ||
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/products',
      }),
      inject: [ConfigService],
    }),
    ProductsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
