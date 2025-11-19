import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Creates a proxy middleware for forwarding requests to microservices.
 * Injects security headers (X-Gateway-Secret) and user context (X-User-Id, X-User-Role).
 *
 * @param targetUrl - The base URL of the target microservice.
 * @param configService - The configuration service to retrieve secrets.
 * @returns A configured http-proxy-middleware instance.
 */
export function createServiceProxy(targetUrl: string, configService: ConfigService) {
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path) => {
      // Remove the prefix (e.g., /auth) from the path
      return path.replace(/^\/[^/]+/, '');
    },
    on: {
      proxyReq: (proxyReq, req: any, res) => {
        // Inject Service-to-Service Security Header
        const sharedSecret = configService.get<string>('GATEWAY_SHARED_SECRET') || '';
        proxyReq.setHeader('X-Gateway-Secret', sharedSecret);

        // Forward user info if available (from AuthGuard)
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.sub);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      },
      error: (err, req, res) => {
        console.error('Proxy Error:', err);
      },
    },
  });

  return proxy;
}
