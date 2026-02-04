import type { MCPResponse } from '../shared/types';

/**
 * Central tutor policy engine.
 *
 * This is where the "tutor personality" lives — the rules that prevent
 * copy-paste learning and guide learners toward active problem-solving.
 *
 * Key principles:
 * - Default to checkpoints & reflection questions (not immediate solutions)
 * - Detect "solution dumps" (large code blocks) and redirect to hint ladders
 * - Keep the tone warm but firm: help them learn, don't do the work for them
 *
 * As the repo grows, we can add:
 * - Per-tool policy overrides
 * - More sophisticated LLM-based guardrails
 * - Learner progress tracking to adjust hint levels
 */

/**
 * Context passed to the policy engine to help it make decisions.
 */
export interface TutorPolicyContext {
  toolName: string;
  learnerLevel: 'beginner' | 'intermediate';
}

/**
 * Fallback checkpoints used when tools don't provide their own.
 *
 * These are intentionally generic: they work for most learning tasks,
 * even if they're not perfectly tailored.
 */
const DEFAULT_CHECKPOINTS = [
  "Before you continue: what is the input and output of what you're building?",
  "What is the smallest next step you can take to verify you're on the right track?",
  'What edge case could break your approach?',
];

/**
 * Default tutor note when tools don't provide guidance.
 *
 * Encourages answering checkpoints first, then sharing attempts before asking for help.
 */
const DEFAULT_TUTOR_NOTES =
  'Answer the checkpoints first. If you want more help, tell me what you tried and what happened.';

/**
 * Applies the central tutor policy to a raw tool response.
 *
 * Flow:
 * 1. Ensure defaults (checkpoints, tutor notes)
 * 2. Apply anti-vibe guardrails (detect solution dumps, redirect to hint ladders)
 * 3. Attach a hint ladder if missing
 *
 * @param raw - The raw response from a tool (before policy)
 * @param ctx - Context about the tool & learner
 * @returns A policy-compliant response ready to send to the learner
 */
export function applyTutorPolicy(raw: MCPResponse, ctx: TutorPolicyContext): MCPResponse {
  const withDefaults = ensureDefaults(raw);
  const withGuardrails = applyAntiVibeGuardrails(withDefaults, ctx);

  /**
   * Always attach a hint ladder (even if the tool didn't provide one).
   *
   * This ensures learners always know they can ask for escalating hints
   * instead of getting stuck.
   */
  return {
    ...withGuardrails,
    hintLadder: withGuardrails.hintLadder ?? {
      level: 1,
      guidance:
        'High-level guidance only. Ask for Hint 2/3 if you get stuck and share your attempt.',
    },
  };
}

/**
 * Ensures the response has checkpoints and tutor notes.
 *
 * If a tool returns empty/missing checkpoints, we insert generic ones.
 * This keeps the learning loop consistent across all tools.
 */
function ensureDefaults(res: MCPResponse): MCPResponse {
  const checkpoints =
    Array.isArray(res.checkpoints) && res.checkpoints.length > 0
      ? res.checkpoints
      : DEFAULT_CHECKPOINTS;

  const tutorNotes = res.tutorNotes?.trim() ? res.tutorNotes : DEFAULT_TUTOR_NOTES;

  return { ...res, checkpoints, tutorNotes };
}

/**
 * Very simple heuristic for now:
 * - If output looks like a huge code dump, we nudge them to break it down.
 *
 * Detection triggers:
 * - Multiple code blocks (``` markers) and many lines
 * - High ratio of code-like lines (imports, const, function, etc.)
 *
 * When triggered, we replace the output with:
 * - A friendly "no solution dump" message
 * - Next steps to guide them toward active learning
 * - Checkpoints that ask them to share their attempt
 *
 * Later we can replace this with:
 * - LLM-based intent detection ("is this a solution request?")
 * - Explicit hint level tracking per conversation
 */
function applyAntiVibeGuardrails(res: MCPResponse, ctx: TutorPolicyContext): MCPResponse {
  const text = stringifyOutput(res.output);

  /**
   * Heuristic triggers:
   * - Multiple code blocks (2+) AND many lines (60+)
   * - Very long output (120+ lines) where >35% look like code
   *
   * This isn't perfect, but it catches most "just give me the answer" cases.
   */
  const codeBlockCount = (text.match(/```/g) ?? []).length;
  const lineCount = text.split('\n').length;
  const looksLikeCode = countCodeLikeLines(text) / Math.max(1, lineCount) > 0.35;

  const suspicious = (codeBlockCount >= 2 && lineCount > 60) || (lineCount > 120 && looksLikeCode);

  if (!suspicious) return res;

  /**
   * Guardrail kicked in: replace the output with a learning-focused redirect.
   *
   * Instead of a solution, we give:
   * - A friendly message explaining why we're not dumping code
   * - Next steps to guide them (share what they're building, show their attempt)
   * - Checkpoints that ask for their current progress
   * - A hint ladder starting at level 1
   */
  return {
    output: {
      message:
        'I’m not going to dump a full solution. Let’s break this into smaller steps so you learn it instead of copy/paste.',
      nextSteps: [
        'Tell me what you’re building (inputs/outputs).',
        'Show me your current attempt (even if it’s messy).',
        'I’ll give Hint 2 (pseudocode) based on your attempt.',
      ],
      originalSummary: summarizeForLearner(ctx.toolName),
    },
    checkpoints: [
      'What have you tried so far? Paste the smallest relevant snippet.',
      'What do you expect to happen, and what actually happened?',
      'What part feels confusing: setup, logic, or debugging?',
    ],
    tutorNotes:
      'This guardrail kicked in because the response looked like a large solution dump. We’ll proceed with a hint ladder instead.',
    hintLadder: {
      level: 1,
      guidance: 'Start with a plan + checkpoints. Ask for Hint 2 with your attempt.',
    },
  };
}

/**
 * Converts output to a string so we can analyze it for guardrails.
 *
 * Handles null/undefined, primitives, and objects gracefully.
 */
function stringifyOutput(output: unknown): string {
  if (output == null) return '';
  if (typeof output === 'string') return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}

/**
 * Counts how many lines look like code (rough heuristic).
 *
 * This checks for common code patterns:
 * - import/export statements
 * - variable declarations (const, let)
 * - function definitions
 * - arrow functions (=>)
 * - Lines ending with { or };
 * - Semicolons (common in JS/TS)
 *
 * It's intentionally simple: we don't need perfection, just a signal.
 */
function countCodeLikeLines(text: string): number {
  const lines = text.split('\n');
  let count = 0;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    // Super rough code signals
    if (
      l.startsWith('import ') ||
      l.startsWith('export ') ||
      l.startsWith('const ') ||
      l.startsWith('let ') ||
      l.startsWith('function ') ||
      l.includes('=>') ||
      l.endsWith('{') ||
      l.endsWith('};') ||
      l.includes(';')
    ) {
      count++;
    }
  }

  return count;
}

/**
 * Returns a tool-specific summary for the learner when a guardrail triggers.
 *
 * This helps them understand *why* we're redirecting and what to expect next.
 * As we add more tools, we can customize this per tool.
 */
function summarizeForLearner(toolName: string) {
  switch (toolName) {
    case 'explain_concept':
      return 'Concept explanations should be short, with checkpoints and examples only after you answer.';
    default:
      return 'We’ll proceed step-by-step with checkpoints before code.';
  }
}
