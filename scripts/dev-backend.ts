import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { spawn, spawnSync, ChildProcess } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const PNPM_CMD = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const USE_SHELL = process.platform === 'win32';
const SERVICES = [
  { name: 'api-gateway', filter: '@puente/api-gateway', port: 3000 },
  { name: 'auth-service', filter: '@puente/auth-service', port: 3001 },
  { name: 'products-service', filter: '@puente/products-service', port: 3002 },
  { name: 'finance-service', filter: '@puente/finance-service', port: 3003 },
  { name: 'logistics-service', filter: '@puente/logistics-service', port: 3004 },
] as const;

const HEALTH_TIMEOUT_MS = 60_000;
const HEALTH_RETRY_MS = 2_000;

function runStep(args: string[], label: string) {
  console.log(`[dev-backend] ${label}`);
  const result = spawnSync(PNPM_CMD, args, { stdio: 'inherit', shell: USE_SHELL });
  if (result.status !== 0) {
    console.error(`[dev-backend] Step failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function startServices(): ChildProcess[] {
  console.log('[dev-backend] Starting backend services in watch mode...');
  return SERVICES.map((service) => {
    const child = spawn(PNPM_CMD, ['--filter', service.filter, 'run', 'start:dev'], {
      stdio: 'inherit',
      env: process.env,
      shell: USE_SHELL,
    });

    child.on('exit', (code, signal) => {
      const reason = code !== null ? `code ${code}` : `signal ${signal}`;
      console.log(`[dev-backend] ${service.name} exited with ${reason}`);
      if (code && code !== 0) {
        console.error(`[dev-backend] ${service.name} crashed. Shutting down...`);
        process.exit(code);
      }
    });

    return child;
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForHealth(service: (typeof SERVICES)[number]) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  const url = `http://localhost:${service.port}/health`;

  const ping = () =>
    new Promise<void>((resolve, reject) => {
      const target = new URL(url);
      const client = target.protocol === 'https:' ? httpsRequest : httpRequest;
      const port = target.port ? Number(target.port) : undefined;
      const request = client(
        {
          hostname: target.hostname,
          port,
          path: target.pathname,
          method: 'GET',
          timeout: 5_000,
        },
        (response) => {
          response.resume();
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Status ${response.statusCode}`));
          }
        },
      );

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy(new Error('timeout'));
      });
      request.end();
    });

  const loop = async (): Promise<void> => {
    while (Date.now() < deadline) {
      try {
        await ping();
        console.log(`[dev-backend] ${service.name} healthy at ${url}`);
        return;
      } catch {
        await sleep(HEALTH_RETRY_MS);
      }
    }
    throw new Error(`Health check timed out for ${service.name}`);
  };

  return loop();
}

function setupShutdown(children: ChildProcess[]) {
  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`[dev-backend] Received ${signal}, stopping services...`);
    children.forEach((child) => {
      if (!child.killed) {
        child.kill();
      }
    });
    console.log(
      '[dev-backend] Services stopped. Run "pnpm dev:infra:down" to tear down Docker if needed.',
    );
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main() {
  runStep(['dev:infra'], 'Bringing up Docker infrastructure');
  runStep(['provision:data'], 'Seeding development data');
  runStep(['dev:db'], 'Applying Prisma schemas');

  const children = startServices();
  setupShutdown(children);

  try {
    await Promise.all(SERVICES.map((service) => waitForHealth(service)));
    console.log('[dev-backend] All services are healthy. Happy hacking!');
  } catch (error) {
    console.error('[dev-backend] Health verification failed:', error);
    process.exit(1);
  }

  // Keep process alive while services run
  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error('[dev-backend] Fatal error:', error);
  process.exit(1);
});
