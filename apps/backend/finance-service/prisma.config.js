require('dotenv/config');

const url = process.env.FINANCE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error('Missing FINANCE_DATABASE_URL or DATABASE_URL for Prisma configuration.');
}

module.exports = {
  schema: './prisma/schema.prisma',
  engine: 'classic',
  datasource: {
    url,
  },
};
