import type { FastifyInstance } from 'fastify';
import { logger } from '../../shared/logger';

/**
 * Registers a single global error handler for the HTTP server.
 *
 * Why this exists:
 * - Keeps error responses consistent
 * - Logs useful request context to help you debug quickly
 *
 * The response shape is intentionally generic (no internal details).
 */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    logger.error('Unhandled error', {
      method: req.method,
      url: req.url,
      err: { message, stack },
    });

    reply.status(500).send({
      error: 'internal_server_error',
      message: 'Something went wrong.',
    });
  });
}
