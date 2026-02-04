import { z } from 'zod';

/**
 * Zod schemas for MCP request validation.
 *
 * Keep these simple and focused: they enforce the request "envelope", not the tool-specific input.
 * Each tool validates its own input using schemas in `toolSchemas.ts`.
 */

/**
 * Validates the learner's proficiency level.
 *
 * Optional because newer learners might not have set this yet.
 */
export const learnerLevelSchema = z.enum(['beginner', 'intermediate']).optional();

/**
 * Validates an MCP request envelope.
 *
 * This is the shape of the body sent to `POST /mcp`.
 * Tools can assume that if this passes, `toolName` is a non-empty string
 * and `userContext` is well-formed (or absent).
 */
export const mcpRequestSchema = z.object({
  toolName: z.string().min(1),
  input: z.unknown(),
  userContext: z
    .object({
      learnerLevel: learnerLevelSchema,
      previousTopics: z.array(z.string()).optional(),
    })
    .optional(),
});
