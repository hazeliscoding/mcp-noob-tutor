/**
 * Centralized tool registration for every transport this server supports.
 *
 * Why this module exists:
 * - The HTTP server and the stdio MCP server both need the same tools
 * - Having one registration site prevents drift (e.g., a tool registered on HTTP
 *   but forgotten on stdio)
 * - Makes adding a new tool a one-line change instead of editing two entry points
 *
 * Usage:
 *   import { bootstrapTools } from './bootstrapTools';
 *   bootstrapTools(); // idempotent; safe to call multiple times
 */
import { registerTool, type MCPTool } from './toolRegistry';
import { explainConceptTool } from './tools/explainConcept.tool';
import { nextTopicTool } from './tools/nextTopic.tool';
import { assessKnowledgeTool } from './tools/assessKnowledge.tool';
import { analyzeAssessmentTool } from './tools/analyzeAssessment.tool';
import { generatePracticeTaskTool } from './tools/generatePracticeTask.tool';

/**
 * Human-readable descriptions for each tool. These are surfaced to LLM clients
 * (Claude Desktop, Cursor, Zed) via MCP `tools/list` so the model knows WHEN
 * to call each tool.
 *
 * Keep these phrased as "Use when …" to help the client disambiguate.
 * When you add a new tool, add its description here.
 */
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  explain_concept:
    'Use when a learner asks "what is X" or needs a concept clarified. Returns a Socratic definition + common mistakes + a mini exercise. Supports a hint ladder (1=definition, 2=demo outline). Never dumps a full solution.',
  next_topic:
    "Use when a learner asks what to study next, or says they finished a topic. Returns the next curriculum topic based on the chosen track (foundation/frontend/backend/fullstack) and what they've already completed.",
  assess_knowledge:
    'Use when a learner wants to self-diagnose on a specific topic. Returns 2-3 diagnostic questions for them to answer. Does NOT grade — follow up with analyze_assessment after they answer.',
  analyze_assessment:
    'Use AFTER the learner has answered an assess_knowledge question set. Takes their answers and returns a gap analysis + a recommendation for the next best action (explain_concept, practice_task, or next_topic).',
  generate_practice_task:
    'Use when a learner wants hands-on practice. Returns a timeboxed, goal-oriented task with self-checks and a rubric — NOT a solution to copy. Learner does the work, then comes back with their submission.',
};

let registered = false;

/**
 * Register every tool the server exposes.
 *
 * Idempotent: safe to call multiple times. Both `httpServer.ts` and
 * `stdioEntry.ts` call this on boot.
 */
export function bootstrapTools(): void {
  if (registered) return;
  registered = true;

  const tools: MCPTool[] = [
    explainConceptTool as MCPTool,
    nextTopicTool as MCPTool,
    assessKnowledgeTool as MCPTool,
    analyzeAssessmentTool as MCPTool,
    generatePracticeTaskTool as MCPTool,
  ];

  for (const tool of tools) {
    registerTool(tool);
  }
}

/**
 * Returns the ordered list of tool names this server exposes.
 *
 * Useful for MCP `tools/list` handlers and for tests that need to enumerate
 * every supported tool.
 */
export function listRegisteredToolNames(): string[] {
  return [
    'explain_concept',
    'next_topic',
    'assess_knowledge',
    'analyze_assessment',
    'generate_practice_task',
  ];
}
