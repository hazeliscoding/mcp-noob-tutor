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
 * The user must provide a non-empty concept string.
 * Optional `hintLevel` lets them request escalating hints (1 = definition, 2 = demo outline).
 * (We validate early so tools don't waste cycles on invalid input.)
 */
export const explainConceptInputSchema = z.object({
  concept: z.string().min(1, 'concept is required'),
  hintLevel: z.union([z.literal(1), z.literal(2)]).optional(),
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
} as const;

/**
 * Helper type: the keys of the toolInputSchemas registry.
 *
 * As you add tools, TypeScript keeps you honest by checking that every
 * tool listed in `ToolName` has an entry in `toolInputSchemas`.
 */
export type ToolInputSchemas = typeof toolInputSchemas;
