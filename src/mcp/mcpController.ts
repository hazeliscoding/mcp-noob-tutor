import type { MCPRequest, MCPResponse } from '../shared/types';
import { getTool } from './toolRegistry';

/**
 * Routes an incoming MCP request to a registered tool.
 *
 * Design goals (for this learning repo):
 * - Make the “dispatch” logic obvious
 * - Keep tool implementations isolated and easy to test in-process
 * - Provide friendly failures when a tool name is unknown
 */
export async function handleMCPRequest(req: MCPRequest): Promise<MCPResponse> {
  const tool = getTool(req.toolName);

  if (!tool) {
    return {
      output: null,
      checkpoints: [],
      tutorNotes: `Unknown tool: ${req.toolName}`,
    };
  }

  /**
   * Minimal context normalization.
   *
   * Tools can assume these fields exist, even if the caller omits `userContext`.
   */
  const ctx = {
    learnerLevel: req.userContext?.learnerLevel ?? 'beginner',
    previousTopics: req.userContext?.previousTopics ?? [],
  };

  return tool.execute(req.input, ctx);
}
