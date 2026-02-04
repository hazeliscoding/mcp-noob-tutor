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
 * (We validate early so tools don't waste cycles on invalid input.)
 */
export const explainConceptInputSchema = z.object({
  concept: z.string().min(1, 'concept is required'),
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

/**
 * Registry of all tool input schemas.
 *
 * Add a new tool? Register its schema here.
 * The router uses this to validate input before dispatching to the tool.
 */
export const toolInputSchemas = {
  explain_concept: explainConceptInputSchema,
  next_topic: nextTopicInputSchema,
} as const;

/**
 * Helper type: the keys of the toolInputSchemas registry.
 *
 * As you add tools, TypeScript keeps you honest by checking that every
 * tool listed in `ToolName` has an entry in `toolInputSchemas`.
 */
export type ToolInputSchemas = typeof toolInputSchemas;
