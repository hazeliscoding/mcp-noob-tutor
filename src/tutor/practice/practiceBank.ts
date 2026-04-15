/**
 * Practice task bank for the noob tutor.
 *
 * This module contains curated, timeboxed practice tasks designed to help learners
 * actively apply concepts they've learned. Each task is:
 * - Focused on one topic (e.g., HTTP basics, SQL joins)
 * - Timeboxed (15–60 minutes) to encourage focused effort
 * - Structured with goal, constraints, steps, self-checks, rubric, and pitfalls
 * - Beginner-friendly: no overwhelming code dumps, emphasizes understanding
 *
 * Tasks are designed to be "just enough" — they build confidence without frustration.
 * Learners complete the task, then submit their work for feedback.
 *
 * Adding a new task:
 * 1. Pick a topic from topicGraph.ts
 * 2. Choose difficulty (easy/medium) and timebox
 * 3. Write goal, constraints, steps, self-checks, rubric, pitfalls
 * 4. Add to PRACTICE_BANK array
 */
import type { TopicId } from '../curriculum/topicGraph';

/**
 * Difficulty levels for practice tasks.
 *
 * - `easy`: Basic application, minimal setup, clear success criteria
 * - `medium`: More complex, requires planning, potential for mistakes
 */
export type PracticeDifficulty = 'easy' | 'medium';

/**
 * A single practice task.
 *
 * Tasks are structured to guide learners through active learning:
 * - Goal: What success looks like
 * - Constraints: Limits to focus effort (e.g., no DB, paper design only)
 * - Steps: Guided breakdown of what to do
 * - Self-checks: Questions to verify understanding during the task
 * - Rubric: How we evaluate completion (for feedback)
 * - Pitfalls: Common mistakes to avoid
 */
export interface PracticeTask {
  id: string;
  topic: TopicId;
  title: string;
  timeboxMinutes: 15 | 30 | 45 | 60;
  difficulty: PracticeDifficulty;
  goal: string;
  constraints: string[];
  steps: string[];
  selfChecks: string[];
  rubric: Array<{ criteria: string; looksLike: string }>;
  commonPitfalls: string[];
}

/**
 * The curated bank of practice tasks.
 *
 * Each task is designed to be:
 * - Doable in the timebox (no over-engineering)
 * - Focused on one concept (no multi-topic sprawl)
 * - Guided but not spoon-fed (learners do the work)
 * - Verifiable (self-checks + rubric for feedback)
 *
 * Tasks emphasize active learning: build something small, reflect on it,
 * then submit for analysis/assessment.
 */
export const PRACTICE_BANK: PracticeTask[] = [
  {
    id: 'http-echo-json',
    topic: 'http_basics',
    title: 'HTTP: Build a tiny JSON endpoint and observe the response',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Understand status code + headers + JSON body as a response contract.',
    constraints: ['Do NOT use a database.', 'Return JSON only.', 'Use curl to verify behavior.'],
    steps: [
      'Create a GET /ping route that returns { ok: true }',
      'Add a GET /ping?name=Hazel that returns { ok: true, name: "Hazel" }',
      'Add a GET /fail route that returns status 404 with { error: "not_found" }',
      'Use curl to inspect status codes and headers.',
    ],
    selfChecks: [
      'Can you see the status code in curl output?',
      'Do your responses always return valid JSON?',
      'Does /fail return a 404 and not a 200?',
    ],
    rubric: [
      { criteria: 'Correct status codes', looksLike: '200 for /ping, 404 for /fail' },
      { criteria: 'Consistent JSON shape', looksLike: 'Always returns an object (not plain text)' },
      { criteria: 'Verification', looksLike: 'You used curl to confirm status + body' },
    ],
    commonPitfalls: [
      'Returning 200 with an error message instead of 404.',
      'Mixing text/plain with JSON responses.',
      'Not actually verifying with curl (guessing).',
    ],
  },

  {
    id: 'rest-notes-contract',
    topic: 'api_rest_basics',
    title: 'REST: Design an API contract for a Notes resource',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Learn to design consistent routes + DTOs + errors before writing code.',
    constraints: [
      'No code required (paper design is fine).',
      'Must include at least 1 error response shape.',
      'Must include pagination for list.',
    ],
    steps: [
      'Define a Note DTO (id, title, body, createdAt).',
      'Write endpoints for list/read/create/update/delete.',
      'Define list pagination query params (page, pageSize).',
      'Define an error response object (e.g., { error, message }).',
    ],
    selfChecks: [
      'Does every endpoint have a method + URL + request + response?',
      'Is your error response consistent across endpoints?',
      'Did you include pagination on the list endpoint?',
    ],
    rubric: [
      { criteria: 'RESTful routes', looksLike: 'GET /notes, GET /notes/{id}, POST /notes...' },
      { criteria: 'Consistent DTOs', looksLike: 'Same field names everywhere' },
      { criteria: 'Error contract', looksLike: 'A repeatable error JSON shape' },
    ],
    commonPitfalls: [
      'Using verbs in routes (/getNotes).',
      'No error shape or inconsistent errors per endpoint.',
      'No pagination (list endpoints don’t scale).',
    ],
  },

  {
    id: 'cors-mental-model',
    topic: 'cors_basics',
    title: 'CORS: Prove you understand who blocks what',
    timeboxMinutes: 15,
    difficulty: 'easy',
    goal: 'Build the mental model: browser-enforced cross-origin rules.',
    constraints: [
      'No code required.',
      'You must use precise language: browser vs server vs client.',
    ],
    steps: [
      'Write a 5-sentence explanation of CORS in your own words.',
      'Answer: why does Postman work when the browser fails?',
      'Describe what a preflight OPTIONS request is and when it happens.',
    ],
    selfChecks: [
      'Did you explicitly mention the browser enforcing it?',
      'Did you mention origins (scheme + host + port)?',
      'Did you mention preflight?',
    ],
    rubric: [
      { criteria: 'Correct enforcement model', looksLike: 'Browser blocks JS cross-origin calls' },
      { criteria: 'Correct Postman explanation', looksLike: 'Postman isn’t bound by browser SOP' },
      { criteria: 'Preflight understanding', looksLike: 'OPTIONS before non-simple requests' },
    ],
    commonPitfalls: [
      'Saying the server blocks it (server only sends headers).',
      'Confusing CORS with authentication.',
      'Not understanding origins include ports.',
    ],
  },

  {
    id: 'sql-join-explain',
    topic: 'sql_basics',
    title: 'SQL: Explain a JOIN using a concrete example',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Build relational intuition: data split across tables + recombined via joins.',
    constraints: [
      'No actual DB required.',
      'Use a concrete example with two tables and 3 rows each.',
    ],
    steps: [
      'Create two imaginary tables: Users(id,name) and Orders(id,userId,total).',
      'Write 3 example rows for each.',
      'Write a query in plain English that lists order totals with user names.',
      'Then write the actual SQL JOIN query.',
    ],
    selfChecks: [
      'Do your example rows make sense (order.userId matches a user.id)?',
      'Does your SQL select fields from both tables?',
      'Do you understand why the JOIN is required?',
    ],
    rubric: [
      { criteria: 'Correct mapping', looksLike: 'Foreign key links orders to users' },
      { criteria: 'Correct join condition', looksLike: 'ON orders.userId = users.id' },
      { criteria: 'Explains the why', looksLike: 'Because normalized data is in separate tables' },
    ],
    commonPitfalls: [
      'Joining on the wrong columns.',
      'Not qualifying column names (ambiguous).',
      'Confusing INNER JOIN vs LEFT JOIN (we’ll cover later).',
    ],
  },

  {
    id: 'auth-authz-diff',
    topic: 'auth_basics',
    title: 'Auth: Explain authentication vs authorization with examples',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Separate identity proof from permission checks.',
    constraints: ['No code required.', 'Must include 2 examples for each term.'],
    steps: [
      'Define authentication in one sentence.',
      'Define authorization in one sentence.',
      'Give 2 examples of authentication.',
      'Give 2 examples of authorization.',
      'Describe where JWT fits (auth vs authz vs transport).',
    ],
    selfChecks: [
      'Did you keep auth and authz separate?',
      'Did you include examples that aren’t the same thing?',
      'Did you mention JWT is usually about auth (proof) not permission logic?',
    ],
    rubric: [
      { criteria: 'Clear distinction', looksLike: 'AuthN=who you are, AuthZ=what you can do' },
      { criteria: 'Useful examples', looksLike: 'Login is authN; admin-only endpoint is authZ' },
      {
        criteria: 'JWT placement',
        looksLike: 'Token proves identity; permissions still checked server-side',
      },
    ],
    commonPitfalls: [
      'Using auth/authz interchangeably.',
      'Assuming JWT automatically grants permissions safely.',
      'Not understanding server must still enforce authorization.',
    ],
  },
];

/**
 * Picks a practice task matching the exact criteria.
 *
 * Searches the bank for a task with the specified topic, difficulty, and timebox.
 * Returns the first match, or null if none found.
 *
 * @param args - Selection criteria (topic, difficulty, timebox)
 * @returns The matching task, or null if not found
 */
export function pickPracticeTask(args: {
  topic: TopicId;
  difficulty: PracticeDifficulty;
  timeboxMinutes: PracticeTask['timeboxMinutes'];
}): PracticeTask | null {
  const candidates = PRACTICE_BANK.filter(
    (t) =>
      t.topic === args.topic &&
      t.difficulty === args.difficulty &&
      t.timeboxMinutes === args.timeboxMinutes
  );

  return candidates[0] ?? null;
}

/**
 * Looks up a practice task by its stable `id`.
 *
 * Used by `review_submission` so learners can submit work against the same
 * task they were given by `generate_practice_task`. Returns null when no task
 * has that id (caller should respond with a friendly "unknown task" message).
 *
 * @param id - Task id (e.g., "http-echo-json")
 * @returns The matching task, or null if no task has that id
 */
export function pickPracticeTaskById(id: string): PracticeTask | null {
  return PRACTICE_BANK.find((t) => t.id === id) ?? null;
}
