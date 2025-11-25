import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/auth-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.AUTH_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) {
      throw new Error('Missing AUTH_DATABASE_URL or DATABASE_URL for Prisma client.');
    }
    super({
      datasources: {
        db: { url },
      },
    });
  }

  /**
   * Connects to the database when the module is initialized.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnects from the database when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
