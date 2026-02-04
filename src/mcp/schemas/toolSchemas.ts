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
 * Registry of all tool input schemas.
 *
 * Add a new tool? Register its schema here.
 * The router uses this to validate input before dispatching to the tool.
 */
export const toolInputSchemas = {
  explain_concept: explainConceptInputSchema,
} as const;

/**
 * Helper type: the keys of the toolInputSchemas registry.
 *
 * As you add tools, TypeScript keeps you honest by checking that every
 * tool listed in `ToolName` has an entry in `toolInputSchemas`.
 */
export type ToolInputSchemas = typeof toolInputSchemas;
