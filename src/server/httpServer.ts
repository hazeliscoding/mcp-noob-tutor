import Fastify from 'fastify';
import { registerRoutes } from './routes';
import { registerErrorHandler } from './middleware/errorHandler';
import { logger } from '../shared/logger';

const PORT = Number(process.env.PORT ?? 3333);
const HOST = process.env.HOST ?? '127.0.0.1';

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
