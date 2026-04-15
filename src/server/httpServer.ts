import Fastify from 'fastify';
import { registerRoutes } from './routes';
import { registerErrorHandler } from './middleware/errorHandler';
import { logger } from '../shared/logger';
import { bootstrapTools } from '../mcp/bootstrapTools';

/**
 * HTTP entrypoint for the tutor server.
 *
 * This service exposes two simple endpoints:
 * - `GET /health` for uptime checks
 * - `POST /mcp` to route requests to an in-process MCP-style tool registry
 *
 * Note: this is the HTTP transport. There's also a real MCP transport that
 * speaks JSON-RPC over stdio — see `src/mcp/stdioEntry.ts`. Both transports
 * share the same tool registry via `bootstrapTools()`.
 *
 * Warm note: this file is intentionally small and readable. As you add tools,
 * register them in `src/mcp/bootstrapTools.ts` (not here) so both transports
 * pick them up.
 */

const PORT = Number(process.env.PORT ?? 3333);
const HOST = process.env.HOST ?? '127.0.0.1';

/**
 * Boots the Fastify server and registers routes/tools.
 *
 * Environment variables:
 * - `PORT` (default `3333`)
 * - `HOST` (default `127.0.0.1`)
 */
async function main() {
  const app = Fastify({
    logger: false, // using our own logger for now
  });

  // Basic request logging
  app.addHook('onRequest', async (req) => {
    logger.info('HTTP request', { method: req.method, url: req.url });
  });

  registerErrorHandler(app);
  await registerRoutes(app);

  /**
   * Register all MCP tools via the shared bootstrap. Same tools become
   * available to both HTTP and stdio transports.
   */
  bootstrapTools();

  await app.listen({ port: PORT, host: HOST });
  logger.info(`Server listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  logger.error('Fatal startup error', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
