import type { FastifyInstance } from 'fastify';
import { logger } from '../../shared/logger';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    logger.error('Unhandled error', {
      method: req.method,
      url: req.url,
      err: { message: err.message, stack: err.stack },
    });

    reply.status(500).send({
      error: 'internal_server_error',
      message: 'Something went wrong.',
    });
  });
}
