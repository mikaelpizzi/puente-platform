import 'dotenv/config';
import { defineConfig } from '@prisma/client';

const url = process.env.AUTH_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('Missing AUTH_DATABASE_URL or DATABASE_URL for Prisma configuration.');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    db: {
      provider: 'postgresql',
      url,
    },
  },
});
