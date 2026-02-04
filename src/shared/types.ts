/**
 * Names of tools supported by this server.
 *
 * Keeping this as a union type makes invalid tool names a compile-time error
 * for in-repo callers.
 */
export type ToolName = 'explain_concept';

/**
 * Request shape for `POST /mcp`.
 *
 * - `toolName` selects which tool to run
 * - `input` is tool-specific (each tool validates/casts its own input)
 * - `userContext` gives the tool a bit of learner-aware personalization
 */
export interface MCPRequest {
  toolName: string;
  input: unknown;
  userContext?: {
    learnerLevel?: 'beginner' | 'intermediate';
    previousTopics?: string[];
  };
}

/**
 * Standard response returned by tools.
 *
 * - `output`: tool-specific content (often an object)
 * - `checkpoints`: questions/prompts to encourage active recall
 * - `tutorNotes`: optional guidance, usually addressed to the learner
 */
export interface MCPResponse {
  output: unknown;
  checkpoints: string[];
  tutorNotes?: string;
}
