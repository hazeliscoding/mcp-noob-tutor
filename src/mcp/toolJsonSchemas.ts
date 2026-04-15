/**
 * Hand-rolled JSON Schema definitions for every tool's input.
 *
 * Why not `zod-to-json-schema`?
 * - This project uses Zod v4, and the current `zod-to-json-schema` expects Zod v3's
 *   internal types. Hand-rolling keeps zero conversion magic and is trivially
 *   auditable.
 * - The shapes here are deliberately kept in sync with
 *   `src/mcp/schemas/toolSchemas.ts`. When you add or change a Zod schema there,
 *   update the matching JSON Schema here.
 *
 * These schemas are surfaced to MCP clients (Claude Desktop, Cursor, Zed) via the
 * `tools/list` response so the model knows exactly what fields each tool accepts.
 *
 * If a schema and its Zod counterpart drift, the Zod validation layer is still
 * the source of truth — the MCP client's understanding of the shape may just be
 * slightly stale until someone updates this file.
 */

export interface JsonSchema {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: unknown[];
  minLength?: number;
  minItems?: number;
  oneOf?: JsonSchema[];
  const?: unknown;
}

/**
 * JSON Schema for `explain_concept` input.
 * Mirrors `explainConceptInputSchema` in `toolSchemas.ts`.
 */
const explainConceptJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    concept: {
      type: 'string',
      description: 'The concept/topic the learner wants explained (e.g., "http", "cors", "jwt").',
      minLength: 1,
    },
    hintLevel: {
      type: 'integer',
      description:
        'Escalating hint ladder. 1 = definition, 2 = demo outline, 3 = scaffolded pseudocode (requires learnerAttempt), 4 = full conceptual walkthrough (requires a real attempt).',
      enum: [1, 2, 3, 4],
    },
    learnerAttempt: {
      type: 'string',
      description:
        'What the learner has tried so far. Required when hintLevel is 3 or 4 so the tutor can target hints to their gaps instead of dumping answers.',
    },
  },
  required: ['concept'],
  additionalProperties: false,
};

/**
 * JSON Schema for `next_topic` input.
 */
const nextTopicJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    track: {
      type: 'string',
      description: 'Which learning track to walk. Defaults to "fullstack" when omitted.',
      enum: ['foundation', 'frontend', 'backend', 'fullstack'],
    },
    currentTopic: {
      type: 'string',
      description: 'Optional TopicId the learner just finished (e.g., "http_basics").',
    },
  },
  required: [],
  additionalProperties: false,
};

/**
 * JSON Schema for `assess_knowledge` input.
 */
const assessKnowledgeJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'A TopicId to assess (e.g., "http_basics", "sql_basics").',
      minLength: 1,
    },
  },
  required: ['topic'],
  additionalProperties: false,
};

/**
 * JSON Schema for `analyze_assessment` input.
 */
const analyzeAssessmentJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'The TopicId the learner was assessed on (same one passed to assess_knowledge).',
      minLength: 1,
    },
    answers: {
      type: 'array',
      description:
        "The learner's answers to the diagnostic questions, in the order they were asked.",
      items: { type: 'string', minLength: 1 },
    },
  },
  required: ['topic', 'answers'],
  additionalProperties: false,
};

/**
 * JSON Schema for `generate_practice_task` input.
 */
const generatePracticeTaskJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'A TopicId to generate practice for (e.g., "http_basics").',
      minLength: 1,
    },
    difficulty: {
      type: 'string',
      description: 'Task difficulty. Defaults to "easy" when omitted.',
      enum: ['easy', 'medium'],
    },
    timeboxMinutes: {
      type: 'integer',
      description: 'Desired timebox for the task. Defaults to 30 when omitted.',
      enum: [15, 30, 45, 60],
    },
  },
  required: ['topic'],
  additionalProperties: false,
};

/**
 * JSON Schema for `debug_help` input.
 */
const debugHelpJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    errorText: {
      type: 'string',
      description: 'The exact error message, stack trace, or failing output the learner is seeing.',
      minLength: 1,
    },
    attemptSnippet: {
      type: 'string',
      description:
        'Optional small code snippet (<40 lines) showing the learner\'s current attempt. Helps target hypotheses.',
    },
    whatYouTried: {
      type: 'string',
      description: 'Optional plain-English summary of what the learner has already tried.',
    },
    language: {
      type: 'string',
      description: 'Optional language/stack hint (e.g., "typescript", "python", "sql").',
    },
  },
  required: ['errorText'],
  additionalProperties: false,
};

/**
 * JSON Schema for `review_submission` input.
 */
const reviewSubmissionJsonSchema: JsonSchema = {
  type: 'object',
  properties: {
    taskId: {
      type: 'string',
      description: 'The id of a practice task from generate_practice_task (e.g., "http-echo-json").',
      minLength: 1,
    },
    submission: {
      type: 'string',
      description:
        "The learner's submitted work as plain text (can include code, prose, or a mix). The tutor never rewrites it — only gives Socratic feedback.",
      minLength: 1,
    },
    selfAssessment: {
      type: 'string',
      description:
        "Optional: the learner's own self-assessment of how they did. The tutor will note where it agrees/disagrees.",
    },
  },
  required: ['taskId', 'submission'],
  additionalProperties: false,
};

/**
 * Registry of tool name → JSON Schema for MCP `tools/list` responses.
 *
 * Keep this in sync with `toolInputSchemas` in `schemas/toolSchemas.ts` and with
 * `bootstrapTools.ts`. If you add a new tool, add an entry here too.
 */
export const TOOL_JSON_SCHEMAS: Record<string, JsonSchema> = {
  explain_concept: explainConceptJsonSchema,
  next_topic: nextTopicJsonSchema,
  assess_knowledge: assessKnowledgeJsonSchema,
  analyze_assessment: analyzeAssessmentJsonSchema,
  generate_practice_task: generatePracticeTaskJsonSchema,
  debug_help: debugHelpJsonSchema,
  review_submission: reviewSubmissionJsonSchema,
};
