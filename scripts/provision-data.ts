import { Client } from 'pg';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

// Configuration - In a real scenario, these would come from environment variables or a secure vault
// For this "dry-run" script, we will use placeholders or local fallbacks to demonstrate connectivity logic
const redisUrl =
  process.env.REDIS_URL || process.env.LOGISTICS_VALKEY_URL || 'redis://localhost:6379';
const parsedRedisUrl = new URL(redisUrl);

const CONFIG = {
  postgres: {
    host: process.env.PG_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.PG_USER || process.env.POSTGRES_USER || 'puente',
    password: process.env.PG_PASSWORD || process.env.POSTGRES_PASSWORD || 'puente',
    database: process.env.PG_DATABASE || process.env.POSTGRES_DB || 'puente',
  },
  mongo: {
    uri:
      process.env.MONGO_URI ||
      process.env.PRODUCTS_MONGO_URI ||
      `mongodb://${process.env.MONGO_ROOT_USER || 'puente'}:${process.env.MONGO_ROOT_PASSWORD || 'puente'}@${
        process.env.MONGO_HOST || 'localhost'
      }:${process.env.MONGO_PORT || '27017'}/admin?authSource=admin`,
  },
  redis: {
    host: process.env.REDIS_HOST || parsedRedisUrl.hostname,
    port: parseInt(process.env.REDIS_PORT || parsedRedisUrl.port || '6379', 10),
    url: redisUrl,
  },
};

async function checkPostgres() {
  console.log('Checking PostgreSQL connection...');
  const client = new Client(CONFIG.postgres);
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ PostgreSQL connected successfully. Server time: ${res.rows[0].now}`);
    return true;
  } catch (err: any) {
    console.error(`❌ PostgreSQL connection failed: ${err.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function checkMongo() {
  console.log('Checking MongoDB connection...');
  const client = new MongoClient(CONFIG.mongo.uri);
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected successfully.');
    return true;
  } catch (err: any) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    return false;
  } finally {
    await client.close();
  }
}

async function checkRedis() {
  console.log('Checking Redis connection...');
  const redis = new Redis({
    host: CONFIG.redis.host,
    port: CONFIG.redis.port,
    lazyConnect: true,
    showFriendlyErrorStack: true,
  });

  try {
    await redis.connect();
    const res = await redis.ping();
    console.log(`✅ Redis connected successfully. PING response: ${res}`);
    redis.disconnect();
    return true;
  } catch (err: any) {
    console.error(`❌ Redis connection failed: ${err.message}`);
    return false;
  }
}

async function generateReport(results: { pg: boolean; mongo: boolean; redis: boolean }) {
  const reportPath = path.join(__dirname, '../../docs/data/tenants.md');
  const sanitizedMongoUri = CONFIG.mongo.uri.replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:****@');
  const sanitizedRedis = CONFIG.redis.url.replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:****@');
  const content = `# Data Provisioning Report
Date: ${new Date().toISOString()}

## Connection Status
- **PostgreSQL**: ${results.pg ? '✅ Connected' : '❌ Failed'}
- **MongoDB**: ${results.mongo ? '✅ Connected' : '❌ Failed'}
- **Redis**: ${results.redis ? '✅ Connected' : '❌ Failed'}

## Configuration Used (Sanitized)
- PG Host: ${CONFIG.postgres.host}:${CONFIG.postgres.port}
- Mongo URI: ${sanitizedMongoUri}
- Redis: ${sanitizedRedis}

## Notes
This report was generated automatically by the provisioning script.
`;

  // Ensure directory exists
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(reportPath, content);
  console.log(`\n📄 Report generated at: ${reportPath}`);
}

async function main() {
  console.log('🚀 Starting Data Provisioning Dry-Run...\n');

  const pgResult = await checkPostgres();
  const mongoResult = await checkMongo();
  const redisResult = await checkRedis();

  await generateReport({ pg: pgResult, mongo: mongoResult, redis: redisResult });

  if (pgResult && mongoResult && redisResult) {
    console.log('\n✨ All systems operational!');
    process.exit(0);
  } else {
    console.error('\n⚠️ Some systems failed to connect. Check the report for details.');
    process.exit(1);
  }
}

main();
