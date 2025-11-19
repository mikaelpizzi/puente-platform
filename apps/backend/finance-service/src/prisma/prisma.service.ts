import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.FINANCE_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!url) {
      throw new Error('Missing FINANCE_DATABASE_URL or DATABASE_URL for Prisma client.');
    }
    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
