import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { GLOSSARY, normalizeConcept } from '../../tutor/glossary/glossary';

/**
 * Input contract for the `explain_concept` tool.
 *
 * Supports:
 * - `concept`: the topic to explain (required)
 * - `hintLevel`: 1 (definition) or 2 (demo outline) - defaults to 1
 */
interface ExplainConceptInput {
  concept: string;
  hintLevel?: 1 | 2;
}

/**
 * The explain_concept tool: glossary + progressive hint ladder.
 *
 * Flow:
 * 1. Look up concept in glossary (with fallback aliasing for synonyms)
 * 2. If not found: Socratic approach (ask what they think, where they saw it)
 * 3. If found + hintLevel 1: return definition + why it matters + common mistakes
 * 4. If hintLevel 2: return demo outline + mini exercise (no full code)
 *
 * Design notes:
 * - Glossary entries are curated for beginners (jargon-free, concrete examples)
 * - Demo outlines use pseudocode or English descriptions, not full implementations
 * - Hint ladder encourages answering checkpoints before escalating
 *
 * Adding new concepts:
 * - Add entries to src/tutor/glossary/glossary.ts
 * - Update explainConceptInputSchema in src/mcp/schemas/toolSchemas.ts if needed
 * - (optional) Add aliases in guessAlias() below for synonyms (e.g., "swagger" → "rest")
 */
export const explainConceptTool: MCPTool<ExplainConceptInput> = {
  name: 'explain_concept',

  async execute(input, ctx): Promise<MCPResponse> {
    const raw = input.concept;
    const key = normalizeConcept(raw);

    /**
     * Look up the concept in the glossary.
     * Try exact match first, then try aliases (e.g., "swagger" → "rest").
     */
    const entry = GLOSSARY[key] ?? GLOSSARY[guessAlias(key)] ?? null;

    const hintLevel = input.hintLevel ?? 1;

    /**
     * Concept not in glossary: Socratic fallback.
     *
     * Instead of saying "sorry, I don't know", we ask the learner to:
     * 1. Share their current understanding
     * 2. Tell us where they encountered it
     * 3. Then we can help more meaningfully
     */
    if (!entry) {
      return {
        output: {
          concept: raw,
          message:
            'I don’t have this concept in my built-in glossary yet. I can still help, but we’ll do it Socratically.',
          approach: [
            'Tell me what you *think* it means.',
            'Tell me where you encountered it (tutorial, error message, code).',
            'Then I’ll correct gaps and give you a tiny demo outline.',
          ],
        },
        checkpoints: [
          `Where did you run into "${raw}"? (what were you doing?)`,
          `What do you currently believe "${raw}" means?`,
          'What would be a real-world use case for it?',
        ],
        tutorNotes:
          'Answer these first. Then ask again and include your answers so I can tailor the explanation.',
      };
    }

    /**
     * Concept found. Hint Level 1: Definition + Why + Common Mistakes.
     *
     * This is the "first contact" hint: enough to understand the concept,
     * but not enough to just copy/paste a solution.
     * Learner must answer checkpoints to unlock Hint 2.
     */
    if (hintLevel === 1) {
      return {
        output: {
          concept: entry.concept,
          shortDefinition: entry.shortDefinition,
          whyItMatters: entry.whyItMatters,
          commonMistakes: entry.commonMistakes,
        },
        checkpoints: [
          `In your own words, restate: "${entry.shortDefinition}"`,
          'Which common mistake feels most likely for you, and why?',
          'What’s one question you still have about this concept?',
        ],
        tutorNotes:
          'If you answer these, ask for Hint 2 and I’ll give a tiny demo outline + a mini exercise.',
        hintLadder: {
          level: 1,
          guidance:
            'Concept + why it matters + common mistakes. Answer checkpoints to unlock Hint 2.',
        },
      };
    }

    /**
     * Hint Level 2: Demo Outline + Mini Exercise.
     *
     * We give a step-by-step outline of a tiny demo (not full code).
     * Learner builds it themselves, checking their understanding with the exercise.
     */
    // Hint 2: demo outline (not full code)
    return {
      output: {
        concept: entry.concept,
        beginnerExample: entry.beginnerExample,
        miniExercise: entry.miniExercise,
        demoOutline: buildDemoOutline(entry.concept),
      },
      checkpoints: [
        'Write down the expected input/output of the demo (even if it’s tiny).',
        'What would you test first to prove it works?',
        'What’s the most likely bug you’ll hit building it?',
      ],
      tutorNotes:
        'Build the demo outline yourself. If you get stuck, paste your attempt and ask for a smaller hint.',
      hintLadder: {
        level: 2,
        guidance: 'Demo outline + mini exercise. Paste your attempt for more targeted hints.',
      },
    };
  },
};

/**
 * Attempt to find a concept by alias.
 *
 * Some concepts have multiple names (e.g., "swagger" and "openapi" for REST docs,
 * or "https" and "tls" for encryption). This maps common aliases to canonical names.
 *
 * If no alias matches, return the original key (caller will check if it exists).
 */
function guessAlias(key: string): string {
  // small aliasing to help beginners
  if (key === 'swagger' || key === 'openapi') return 'rest';
  if (key === 'https' || key === 'tls') return 'http';
  return key;
}

/**
 * Generates a demo outline for a concept.
 *
 * These are step-by-step guides (not full code) to help learners build a tiny proof-of-concept.
 * Outlines are plain English or pseudocode: learners do the implementation.
 *
 * When adding a new concept entry to the glossary:
 * - Add a case here if you want a custom demo outline
 * - Otherwise, the default outline (last case) is used
 */
function buildDemoOutline(concept: string) {
  switch (concept.toLowerCase()) {
    case 'http':
      return [
        'Make a simple GET endpoint that returns JSON { ok: true }',
        'Call it with curl and observe: status code + headers + body',
        'Change the endpoint to return 404 and observe what changes',
      ];
    case 'rest':
      return [
        'Pick a resource: notes',
        'Define routes: list, read, create, update',
        'Write example request/response JSON for each route (no code yet)',
      ];
    case 'cors':
      return [
        'Run a frontend on one localhost port and an API on another',
        'Make a fetch call and observe the browser error',
        'Add a server CORS allowlist for the frontend origin and retry',
      ];
    case 'sql':
      return [
        'Create two tables: users and orders (on paper is fine)',
        'Write a query to list orders with the user name',
        'Explain in words why the JOIN is needed',
      ];
    case 'jwt':
      return [
        'Write down a login flow: request, response, where token is stored',
        'List 3 fields a token might include (sub, exp, roles)',
        'Explain what the server must verify on every request',
      ];
    default:
      return [
        'Define the smallest possible example that proves you understand the concept.',
        'Write the expected input/output.',
        "List common failure modes and how you'd detect them.",
      ];
  }
}
