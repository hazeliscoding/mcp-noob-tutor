import { z } from 'zod';

/**
 * Zod schemas for tool-specific inputs.
 *
 * Each tool declares its own input validation. This keeps tools self-contained
 * and makes it easy to add or modify tools without touching the MCP envelope validation.
 */

/**
 * Schema for `explain_concept` tool input.
 *
 * Required:
 * - `concept`: the topic to explain (non-empty string).
 *
 * Optional:
 * - `hintLevel`: escalating hints — 1 (definition), 2 (demo outline),
 *   3 (scaffolded pseudocode with blanks), 4 (full conceptual walkthrough).
 *   Levels 3 and 4 are gated by `learnerAttempt` — the tutor will refuse to
 *   escalate without evidence of effort.
 * - `learnerAttempt`: the learner's current attempt (free-form string). Needed
 *   to unlock levels 3-4.
 *
 * (We validate early so tools don't waste cycles on invalid input.)
 */
export const explainConceptInputSchema = z.object({
  concept: z.string().min(1, 'concept is required'),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  learnerAttempt: z.string().optional(),
});

/**
 * Schema for `next_topic` tool input.
 *
 * Learners can specify:
 * - `track`: which learning track to follow (defaults to 'fullstack')
 * - `currentTopic`: optional topic they just finished (to mark as completed)
 *
 * This lets the curriculum system pick the next appropriate topic based on
 * prerequisites and progress.
 */
export const nextTopicInputSchema = z.object({
  track: z.enum(['foundation', 'frontend', 'backend', 'fullstack']).optional(),
  currentTopic: z.string().optional(),
});

export const assessKnowledgeInputSchema = z.object({
  topic: z.string().min(1),
});

/**
 * Schema for `analyze_assessment` tool input.
 *
 * Learners provide the topic they assessed and their answers to diagnostic questions.
 * Used to analyze gaps and provide personalized recommendations.
 */
export const analyzeAssessmentInputSchema = z.object({
  topic: z.string().min(1),
  answers: z.array(z.string().min(1)),
});

/**
 * Schema for `generate_practice_task` tool input.
 *
 * Learners specify a topic to practice, with optional difficulty and timebox.
 * Used to select a matching task from the practice bank for guided learning.
 */
export const generatePracticeTaskInputSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium']).optional(),
  timeboxMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).optional(),
});

/**
 * Schema for `debug_help` tool input.
 *
 * Learners paste the error/message they're stuck on and (optionally) what they've
 * tried. The tool returns Socratic debugging prompts — NOT a fix.
 */
export const debugHelpInputSchema = z.object({
  errorText: z.string().min(1, 'errorText is required'),
  attemptSnippet: z.string().optional(),
  whatYouTried: z.string().optional(),
  language: z.string().optional(),
});

/**
 * Schema for `review_submission` tool input.
 *
 * Learners submit finished work for a known practice task and optionally include
 * their own self-assessment. The tool gives per-rubric-criterion coaching —
 * never a rewrite.
 */
export const reviewSubmissionInputSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  submission: z.string().min(1, 'submission is required'),
  selfAssessment: z.string().optional(),
});

/**
 * Registry of all tool input schemas.
 *
 * Add a new tool? Register its schema here.
 * The router uses this to validate input before dispatching to the tool.
 */
export const toolInputSchemas = {
  explain_concept: explainConceptInputSchema,
  next_topic: nextTopicInputSchema,
  assess_knowledge: assessKnowledgeInputSchema,
  analyze_assessment: analyzeAssessmentInputSchema,
  generate_practice_task: generatePracticeTaskInputSchema,
  debug_help: debugHelpInputSchema,
  review_submission: reviewSubmissionInputSchema,
} as const;

/**
 * Helper type: the keys of the toolInputSchemas registry.
 *
 * As you add tools, TypeScript keeps you honest by checking that every
 * tool listed in `ToolName` has an entry in `toolInputSchemas`.
 */
export type ToolInputSchemas = typeof toolInputSchemas;
