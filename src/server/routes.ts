import type { FastifyInstance } from 'fastify';
import { handleMCPRequest } from '../mcp/mcpController';
import type { MCPRequest } from '../shared/types';

/**
 * Registers HTTP routes for the service.
 *
 * Routes:
 * - `GET /health` → `{ ok: true }`
 * - `POST /mcp` → forwards a typed-ish body into the MCP controller
 *
 * This is kept as a tiny “wiring layer”: it shouldn’t contain learning logic.
 */
export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  app.post('/mcp', async (req) => {
    /**
     * Fastify's `req.body` is `unknown` by default.
     * We validate at the tool level for now (simple project), so we cast here.
     */
    const body = req.body as MCPRequest;
    return handleMCPRequest(body);
  });
}
