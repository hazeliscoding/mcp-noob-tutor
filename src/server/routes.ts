import type { FastifyInstance } from 'fastify';
import { handleMCPRequest } from '../mcp/mcpController';
import type { MCPRequest } from '../shared/types';
import { mcpRequestSchema } from '../mcp/schemas/mcpSchemas';
import { toolInputSchemas } from '../mcp/schemas/toolSchemas';
import { validate } from '../shared/validation';

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

  /**
   * The MCP dispatch endpoint.
   *
   * Flow:
   * 1. Validate request envelope (toolName, input, userContext format)
   * 2. Look up the tool's schema
   * 3. Validate the tool-specific input
   * 4. If all passes, dispatch to the controller with validated data
   *
   * Keeping validation here (not in tools) means:
   * - Tools can assume their input is safe
   * - Errors are caught early and reported as JSON
   * - It's clear to readers where the validation boundary is
   */
  app.post('/mcp', async (req, reply) => {
    // Validate MCP request envelope
    const env = validate(mcpRequestSchema, req.body);
    if (!env.ok) {
      return reply.status(400).send({
        error: 'invalid_request',
        message: 'MCP request failed validation.',
        issues: env.issues,
      });
    }

    const toolName = env.data.toolName;

    // Validate tool input using tool-specific schema (if we have one)
    const schema = (toolInputSchemas as Record<string, any>)[toolName];
    if (!schema) {
      return reply.status(400).send({
        error: 'unknown_tool',
        message: `Unknown tool: ${toolName}`,
      });
    }

    const toolInput = validate(schema, env.data.input);
    if (!toolInput.ok) {
      return reply.status(400).send({
        error: 'invalid_tool_input',
        message: `Tool input failed validation for: ${toolName}`,
        issues: toolInput.issues,
      });
    }

    // Dispatch, but swap in validated input
    return handleMCPRequest({
      ...env.data,
      input: toolInput.data,
    });
  });
}
