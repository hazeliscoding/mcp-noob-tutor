#!/usr/bin/env node
/**
 * Bin entrypoint for the stdio MCP transport.
 *
 * Usage (local dev):
 *   npm run mcp:stdio
 *
 * Usage (after build):
 *   node dist/mcp/stdioEntry.js
 *
 * Usage (via MCP client config):
 *   {
 *     "mcpServers": {
 *       "noob-tutor": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/dist/mcp/stdioEntry.js"]
 *       }
 *     }
 *   }
 *
 * IMPORTANT: This entrypoint must not print anything to stdout. stdout is the
 * JSON-RPC channel the MCP client is reading from — any stray `console.log`
 * would corrupt the transport. All diagnostics go to stderr.
 */
import { bootstrapTools } from './bootstrapTools';
import { runStdioServer } from './stdioServer';

async function main(): Promise<void> {
  bootstrapTools();
  await runStdioServer();
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  process.stderr.write(
    `[mcp-noob-tutor] fatal ${JSON.stringify({ message, stack })}\n`
  );
  process.exit(1);
});
