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
import { debugHelpTool } from './tools/debugHelp.tool';
import { reviewSubmissionTool } from './tools/reviewSubmission.tool';

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
    'Use when a learner asks "what is X" or needs a concept clarified. Returns a Socratic definition + common mistakes + a mini exercise. Supports a hint ladder (1=definition, 2=demo outline, 3=scaffolded pseudocode with blanks, 4=full conceptual walkthrough). Levels 3+ require a learnerAttempt field showing the learner tried.',
  next_topic:
    "Use when a learner asks what to study next, or says they finished a topic. Returns the next curriculum topic based on the chosen track (foundation/frontend/backend/fullstack) and what they've already completed.",
  assess_knowledge:
    'Use when a learner wants to self-diagnose on a specific topic. Returns 2-3 diagnostic questions for them to answer. Does NOT grade — follow up with analyze_assessment after they answer.',
  analyze_assessment:
    'Use AFTER the learner has answered an assess_knowledge question set. Takes their answers and returns a gap analysis + a recommendation for the next best action (explain_concept, practice_task, or next_topic).',
  generate_practice_task:
    'Use when a learner wants hands-on practice. Returns a timeboxed, goal-oriented task with self-checks and a rubric — NOT a solution to copy. Learner does the work, then comes back with review_submission.',
  debug_help:
    "Use when a learner is stuck on an error or bug. Returns ranked hypotheses about likely causes + a checklist of verification steps + the ONE next question they should answer. Does NOT fix their code — this is a thinking tool to help them diagnose.",
  review_submission:
    "Use when a learner has finished a practice task (from generate_practice_task) and wants feedback. Walks the task's rubric and gives per-criterion status + coaching questions. Never rewrites their code — only asks guiding questions.",
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
    debugHelpTool as MCPTool,
    reviewSubmissionTool as MCPTool,
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
    'debug_help',
    'review_submission',
  ];
}
