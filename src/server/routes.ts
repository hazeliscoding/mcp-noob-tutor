import type { FastifyInstance } from 'fastify';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  app.post('/mcp', async (req) => {
    // TODO: add tool dispatch + validation.
    return {
      ok: true,
      message: 'MCP endpoint stub',
      received: req.body ?? null,
    };
  });
}
