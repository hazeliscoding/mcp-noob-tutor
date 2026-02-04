import type { MCPRequest, MCPResponse } from '../shared/types';
import { applyTutorPolicy } from '../tutor/tutorPolicy';
import { getTool } from './toolRegistry';

/**
 * Routes an incoming MCP request to a registered tool.
 *
 * Design goals (for this learning repo):
 * - Make the “dispatch” logic obvious
 * - Keep tool implementations isolated and easy to test in-process
 * - Provide friendly failures when a tool name is unknown
 * - Apply central tutor policy to all responses (guardrails, hint ladders, checkpoints)
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

  const raw = await tool.execute(req.input, ctx);

  /**
   * Apply central tutor policy to the tool's response.
   *
   * The policy layer:
   * - Ensures checkpoints and tutor notes are present
   * - Detects "solution dumps" and redirects to hint ladders
   * - Attaches a hint ladder for progressive disclosure
   *
   * Tools don't need to know about this: they just return their raw response.
   */
  return applyTutorPolicy(raw, {
    toolName: req.toolName,
    learnerLevel: ctx.learnerLevel,
  });
}
