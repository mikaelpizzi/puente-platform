import { Client } from 'pg';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - In a real scenario, these would come from environment variables or a secure vault
// For this "dry-run" script, we will use placeholders or local fallbacks to demonstrate connectivity logic
const CONFIG = {
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DATABASE || 'postgres',
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
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
  const content = `# Data Provisioning Report
Date: ${new Date().toISOString()}

## Connection Status
- **PostgreSQL**: ${results.pg ? '✅ Connected' : '❌ Failed'}
- **MongoDB**: ${results.mongo ? '✅ Connected' : '❌ Failed'}
- **Redis**: ${results.redis ? '✅ Connected' : '❌ Failed'}

## Configuration Used (Sanitized)
- PG Host: ${CONFIG.postgres.host}
- Mongo URI: ${CONFIG.mongo.uri.replace(/:([^:@]+)@/, ':****@')}
- Redis Host: ${CONFIG.redis.host}

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
