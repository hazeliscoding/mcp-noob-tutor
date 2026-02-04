/**
 * Glossary system: curated explanations of core web dev concepts.
 *
 * This module is the "knowledge base" for the `explain_concept` tool.
 * Each entry has:
 * - A plain-language definition
 * - Why it matters (motivation for learners)
 * - Common mistakes (mental models that trip beginners up)
 * - Beginner examples (concrete, not abstract)
 * - Mini exercises (small tasks to activate learning)
 *
 * Design philosophy:
 * - No jargon-on-jargon (definitions are accessible)
 * - Each entry points to the "why" not just the "what"
 * - Examples are real-world enough to be memorable
 *
 * Adding a new concept:
 * 1. Add it here with all 6 fields
 * 2. Update toolSchemas.ts if the input validation changes
 * 3. (optional) Add aliases in explainConcept.tool's guessAlias() function
 */

export interface GlossaryEntry {
  concept: string;
  shortDefinition: string;
  whyItMatters: string;
  commonMistakes: string[];
  beginnerExample: string; // plain language, no big code dumps
  miniExercise: string; // short task prompt
}

/**
 * The glossary database.
 *
 * Keys are normalized concept names (lowercase, trimmed).
 * Values are full entries with definition, examples, and teaching guidance.
 */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  http: {
    concept: 'HTTP',
    shortDefinition: 'HTTP is the request/response protocol your browser uses to talk to servers.',
    whyItMatters: 'If you understand HTTP, API design, debugging, and security become way easier.',
    commonMistakes: [
      "Thinking HTTP is 'the internet' (it’s only one protocol).",
      'Not understanding status codes (200, 404, 401, 500).',
      'Ignoring headers (auth, caching, content-type).',
    ],
    beginnerExample:
      'Your browser sends GET /profile, the server replies with a status code + headers + body (HTML/JSON).',
    miniExercise:
      'Pick a website you use. What HTTP method is used to load a page? What method would be used to submit a form?',
  },

  rest: {
    concept: 'REST',
    shortDefinition:
      'REST is a style for designing APIs around resources (like users, orders) using HTTP methods.',
    whyItMatters: 'Most real-world APIs you’ll consume or build follow REST-ish conventions.',
    commonMistakes: [
      'Using verbs in URLs everywhere (e.g., /getUsers).',
      'Ignoring consistent error responses.',
      'Mixing up PUT vs PATCH.',
    ],
    beginnerExample:
      'GET /users (list), GET /users/123 (read), POST /users (create), PATCH /users/123 (partial update), DELETE /users/123 (remove).',
    miniExercise:
      "Design 4 endpoints for a 'notes' app. Write the method + URL for list/read/create/update.",
  },

  cors: {
    concept: 'CORS',
    shortDefinition:
      'CORS is a browser security rule that controls which websites can call your API from JavaScript.',
    whyItMatters: "It’s one of the most common 'why is my fetch blocked?' issues in frontend dev.",
    commonMistakes: [
      'Thinking CORS is a server-to-server restriction (it’s browser-enforced).',
      'Setting Access-Control-Allow-Origin: * while also using credentials.',
      'Not understanding preflight OPTIONS requests.',
    ],
    beginnerExample:
      'If your frontend runs on http://localhost:4200 and your API is http://localhost:3333, the browser may block the request unless the API allows that origin.',
    miniExercise: 'Explain: why can Postman call your API even when the browser can’t?',
  },

  sql: {
    concept: 'SQL',
    shortDefinition:
      'SQL is a language for querying and updating data in relational databases (tables with rows/columns).',
    whyItMatters:
      'Most backend systems store important data in relational DBs. SQL is a career skill.',
    commonMistakes: [
      'Forgetting WHERE and updating/deleting too many rows.',
      'Not understanding joins and duplicating data.',
      'No indexes + slow queries at scale.',
    ],
    beginnerExample: 'SELECT name FROM users WHERE is_active = true ORDER BY created_at DESC;',
    miniExercise:
      'Given tables Users(id,name) and Orders(id,user_id,total), write in plain English what a JOIN does.',
  },

  jwt: {
    concept: 'JWT',
    shortDefinition:
      'A JWT is a signed token often used to prove a user is authenticated without storing session state on the server.',
    whyItMatters: 'JWTs are common in SPAs and APIs, but they’re easy to misuse.',
    commonMistakes: [
      'Putting secrets in the JWT payload (payload is readable).',
      'Not validating expiration (exp).',
      "Treating JWT as 'encryption' (it’s usually just signed, not encrypted).",
    ],
    beginnerExample:
      'Client logs in, receives a token, then sends Authorization: Bearer <token> on later requests.',
    miniExercise: "In one sentence: what does 'signed' mean compared to 'encrypted'?",
  },
};

/**
 * Normalizes a concept name for lookup in the glossary.
 *
 * Converts to lowercase and trims whitespace so lookups are forgiving.
 * (E.g., "HTTP", "http", " HTTP " all map to "http".)
 */
export function normalizeConcept(concept: string): string {
  return concept.trim().toLowerCase();
}
