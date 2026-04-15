/**
 * Real MCP server over stdio + JSON-RPC.
 *
 * This is what makes the tutor usable from MCP-speaking clients like
 * Claude Desktop, Cursor, or Zed. Each of those clients spawns a subprocess
 * that speaks JSON-RPC 2.0 over stdin/stdout — exactly what
 * `StdioServerTransport` provides.
 *
 * Design principles:
 * - Reuse the existing tool registry and `applyTutorPolicy` layer so the
 *   anti-vibe guardrails behave identically whether the caller is HTTP or MCP.
 * - Zero HTTP, zero Fastify here. stdio mode is bin-only.
 * - Errors go to stderr (process.stderr.write). NEVER log to stdout — stdout
 *   is the JSON-RPC channel and any stray line will corrupt the transport.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getTool } from './toolRegistry';
import { applyTutorPolicy } from '../tutor/tutorPolicy';
import { toolInputSchemas } from './schemas/toolSchemas';
import { validate } from '../shared/validation';
import { TOOL_JSON_SCHEMAS } from './toolJsonSchemas';
import { TOOL_DESCRIPTIONS, listRegisteredToolNames } from './bootstrapTools';

/**
 * Writes a single debug/diagnostic line to stderr. Never to stdout — stdout is
 * reserved for JSON-RPC frames.
 */
function stderrLog(msg: string, meta?: unknown): void {
  const suffix = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
  process.stderr.write(`[mcp-noob-tutor] ${msg}${suffix}\n`);
}

/**
 * Builds the MCP Server instance with `tools/list` and `tools/call` handlers
 * wired up to the existing tool registry.
 *
 * Caller is responsible for attaching a transport (usually `StdioServerTransport`)
 * via `server.connect(transport)`.
 */
export function createStdioServer(): Server {
  const server = new Server(
    {
      name: 'mcp-noob-tutor',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * `tools/list` — tells the client every tool we expose, its description,
   * and the JSON Schema for its input so the model can construct calls.
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const names = listRegisteredToolNames();
    return {
      tools: names.map((name) => ({
        name,
        description: TOOL_DESCRIPTIONS[name] ?? `Tool: ${name}`,
        inputSchema: TOOL_JSON_SCHEMAS[name] ?? {
          type: 'object',
          properties: {},
          additionalProperties: true,
        },
      })),
    };
  });

  /**
   * `tools/call` — dispatches to the in-process tool registry, validates input
   * with Zod (same schemas used by the HTTP route), runs the tutor policy
   * layer, and returns an MCP-shaped `content` response.
   *
   * MCP clients expect `content: Array<{ type: 'text', text: string }>`. We
   * serialize the structured MCPResponse as JSON and wrap it in a single text
   * block — this gives the calling LLM the full tutor structure while keeping
   * the transport generic.
   */
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const toolName = req.params.name;
    const rawArgs = req.params.arguments ?? {};

    const tool = getTool(toolName);
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'unknown_tool',
              message: `Unknown tool: ${toolName}`,
            }),
          },
        ],
      };
    }

    const schema = (toolInputSchemas as Record<string, any>)[toolName];
    if (!schema) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'missing_schema',
              message: `No input schema registered for tool: ${toolName}`,
            }),
          },
        ],
      };
    }

    const validated = validate(schema, rawArgs);
    if (!validated.ok) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'invalid_tool_input',
              message: `Tool input failed validation for: ${toolName}`,
              issues: validated.issues,
            }),
          },
        ],
      };
    }

    try {
      const ctx = { learnerLevel: 'beginner' as const, previousTopics: [] as string[] };
      const raw = await tool.execute(validated.data, ctx);
      const policed = applyTutorPolicy(raw, {
        toolName,
        learnerLevel: ctx.learnerLevel,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(policed, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stderrLog('tool_execute_error', { toolName, message });
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'tool_execute_error',
              message,
            }),
          },
        ],
      };
    }
  });

  return server;
}

/**
 * Boots the stdio MCP server and blocks until the transport closes.
 *
 * Logging goes strictly to stderr — stdout is the JSON-RPC channel.
 */
export async function runStdioServer(): Promise<void> {
  const server = createStdioServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  stderrLog('ready', {
    transport: 'stdio',
    tools: listRegisteredToolNames(),
  });
}
