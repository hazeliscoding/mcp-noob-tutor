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

  {
    id: 'git-branch-and-merge',
    topic: 'git_basics',
    title: 'Git: Design a branching exercise (paper only)',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: "Build muscle memory for feature branches, rebases, and merge commits before touching a real repo.",
    constraints: [
      'Paper / whiteboard only — no actual git required.',
      'Must sketch the commit graph before and after each operation.',
    ],
    steps: [
      'Draw a graph: main with commits A-B-C.',
      'Branch `feat/x` at B. Add commits D and E on the feature branch.',
      'Main gets a new commit F from someone else. Redraw the graph.',
      'Show what the graph looks like after `git merge --no-ff feat/x` into main.',
      'Redraw for the alternative: `git rebase main` on feat/x, then fast-forward merge.',
      'Write one sentence on when you would prefer each approach.',
    ],
    selfChecks: [
      'Do your graphs show the branch point and merge point clearly?',
      'Did you show how rebase rewrites commit hashes?',
      'Did you articulate the trade-off (linear history vs preserved context)?',
    ],
    rubric: [
      {
        criteria: 'Correct initial graph',
        looksLike: 'Main and feature branch with shared ancestor visible',
      },
      {
        criteria: 'Merge commit graph',
        looksLike: 'merge commit with two parents; feature commits preserved',
      },
      {
        criteria: 'Rebase graph',
        looksLike: 'feature commits replayed on top of main; fast-forward merge; linear history',
      },
      {
        criteria: 'Trade-off articulation',
        looksLike: 'rebase=linear but rewrites history; merge=true record of branch lifecycle',
      },
    ],
    commonPitfalls: [
      'Treating rebase and merge as interchangeable.',
      'Forgetting that rebase rewrites commit hashes (dangerous on shared branches).',
      "Drawing graphs that don't distinguish branch tips from historical commits.",
    ],
  },

  {
    id: 'testing-pyramid-reasoning',
    topic: 'testing_basics',
    title: 'Testing: Reason about the test pyramid for a real feature',
    timeboxMinutes: 15,
    difficulty: 'easy',
    goal: 'Apply the test pyramid to a concrete feature instead of parroting the shape.',
    constraints: [
      'No code required.',
      "Pick a feature from an app you actually use — don't invent an abstract one.",
    ],
    steps: [
      'State the feature in one sentence (e.g., "add item to cart").',
      'List 3-5 unit tests you would write for this feature.',
      'List 1-2 integration tests for this feature.',
      'List 1 end-to-end test covering the happy path.',
      'Justify the ratio: why more units than integrations than E2Es?',
    ],
    selfChecks: [
      'Do your unit tests target pure logic (not network/DB)?',
      'Do your integration tests cover real boundaries (two collaborators)?',
      'Does your E2E only cover the critical user journey, not every permutation?',
    ],
    rubric: [
      {
        criteria: 'Concrete feature',
        looksLike: 'A real user-facing flow, not an abstract "test function X"',
      },
      {
        criteria: 'Correct pyramid distribution',
        looksLike: 'most units, fewer integrations, smallest E2E footprint',
      },
      {
        criteria: 'Ratio justification',
        looksLike: 'speed, reliability, scope — units are cheap, E2Es are slow and brittle',
      },
    ],
    commonPitfalls: [
      'Making the E2E the only test ("if it works in the browser it is tested").',
      'Writing "integration tests" that mock everything and are secretly unit tests.',
      'Testing the framework (you do not need to test that React re-renders).',
    ],
  },

  {
    id: 'js-async-explain',
    topic: 'js_fundamentals',
    title: 'JS: Explain async/await using a concrete failure',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Cement the async mental model by reasoning through a bug, not reading a tutorial.',
    constraints: [
      'No code required — this is a writing exercise.',
      "Must reference a specific 'undefined' or 'Promise {}' bug you have seen (yours or a teammate's).",
    ],
    steps: [
      'Describe the bug in one sentence: what was expected vs what happened.',
      'Rewrite the buggy snippet in pseudocode, annotating each line with "sync" or "async".',
      'Identify the exact line where the missing `await` (or misordered operation) caused the bug.',
      'Explain what a Promise represents and why logging it shows `Promise { <pending> }` before it resolves.',
      'Write a one-paragraph rule of thumb you will apply next time to avoid this.',
    ],
    selfChecks: [
      'Did you clearly distinguish "the function returned" from "the work completed"?',
      'Did you name the specific missing step (await, then, etc.)?',
      'Is your rule of thumb concrete enough to apply without re-reading docs?',
    ],
    rubric: [
      {
        criteria: 'Concrete bug example',
        looksLike: 'a specific behavior difference, not "async is confusing"',
      },
      {
        criteria: 'Accurate async labelling',
        looksLike: 'every async call marked; await placement reasoned about',
      },
      {
        criteria: 'Promise state explanation',
        looksLike: 'pending vs fulfilled vs rejected described in your own words',
      },
      {
        criteria: 'Actionable rule of thumb',
        looksLike: '"if X returns a Promise, always await or .then it" style',
      },
    ],
    commonPitfalls: [
      'Treating `async function` as "makes the code wait" — it does not; `await` does.',
      'Believing `Promise.all` is parallelism (it awaits concurrent promises, but they run however the platform schedules them).',
      "Forgetting that `async` functions always return a Promise, even if you `return 1`.",
    ],
  },

  {
    id: 'fetch-error-handling',
    topic: 'fetch_ajax',
    title: 'Fetch: Design error handling for a flaky API call',
    timeboxMinutes: 30,
    difficulty: 'easy',
    goal: 'Handle the full surface of fetch() failures on purpose — not just the happy path.',
    constraints: [
      'No code required — produce a decision table.',
      'Must cover network failure, 4xx, 5xx, and malformed JSON.',
    ],
    steps: [
      'List every way a fetch() call can fail.',
      'For each failure, write: how does fetch surface it (reject? resolve with !ok?)? ',
      'Decide the UX for each failure (retry? show error? fall back to cached data?).',
      'Decide what gets logged and at what severity.',
      'Sketch one reusable wrapper function signature (pseudocode) that enforces this everywhere.',
    ],
    selfChecks: [
      'Did you remember that fetch() does NOT reject on HTTP 4xx/5xx?',
      'Did you distinguish user-actionable errors from infrastructure errors?',
      'Does your wrapper signature force callers to handle both success and failure?',
    ],
    rubric: [
      {
        criteria: 'Complete failure taxonomy',
        looksLike: 'network error, 4xx, 5xx, malformed body, timeout — each named',
      },
      {
        criteria: 'Correct fetch semantics',
        looksLike: 'only network errors reject; !response.ok must be checked manually',
      },
      {
        criteria: 'Sensible UX decisions',
        looksLike: 'retry on 5xx, show error on 4xx, never silently swallow errors',
      },
      {
        criteria: 'Reusable wrapper signature',
        looksLike: 'returns a discriminated union Result<T,E> or calls onError callback',
      },
    ],
    commonPitfalls: [
      'Assuming fetch() rejects on 500 (it does not — you must check response.ok).',
      'Catching a rejection and then ignoring non-rejection failures.',
      'Swallowing errors with empty .catch(()=>{}) blocks.',
    ],
  },

  {
    id: 'rest-notes-medium',
    topic: 'api_rest_basics',
    title: 'REST: Extend the Notes API with auth + filtering + a versioning plan',
    timeboxMinutes: 45,
    difficulty: 'medium',
    goal: 'Turn a toy CRUD API into a real-world contract: auth, filtering, versioning.',
    constraints: [
      'No code required — produce a design doc.',
      'Must reuse the Notes DTO from the easy version of this task.',
      "Assume the API already has GET/POST/PATCH/DELETE for notes.",
    ],
    steps: [
      'Add an authentication scheme (describe which header, what token shape).',
      'Add authorization rules: who can read/edit which notes (ownership model).',
      "Extend GET /notes to support ?q= search and ?tag= filtering. Define the exact semantics (AND vs OR? case-sensitive?).",
      'Decide a versioning strategy: URL prefix (/v1) vs header. Pick one and justify.',
      'Write a deprecation plan: if /v1 goes away, how do clients find out and migrate?',
    ],
    selfChecks: [
      'Is your auth model explicit about what the server verifies on each request?',
      'Are search/filter semantics unambiguous for a client implementer?',
      'Does the versioning plan tell a client how to detect a deprecated endpoint?',
    ],
    rubric: [
      {
        criteria: 'Authentication detail',
        looksLike: 'header name, token format, server verification steps specified',
      },
      {
        criteria: 'Authorization rules',
        looksLike: 'who can do what stated in terms of ownership, not just "logged in"',
      },
      {
        criteria: 'Unambiguous filter semantics',
        looksLike: 'AND/OR, case, pagination interaction all explicit',
      },
      {
        criteria: 'Versioning decision + justification',
        looksLike: 'URL vs header chosen with a concrete reason',
      },
      {
        criteria: 'Deprecation plan',
        looksLike: 'Deprecation header, sunset date, client migration steps',
      },
    ],
    commonPitfalls: [
      'Adding "auth" without specifying which header and validation.',
      'Ambiguous filter semantics that every client implements differently.',
      'No deprecation plan — versions pile up forever.',
    ],
  },

  {
    id: 'sql-join-medium',
    topic: 'sql_basics',
    title: 'SQL: Write 3 JOIN variants for a realistic reporting query',
    timeboxMinutes: 45,
    difficulty: 'medium',
    goal: "Move beyond INNER JOIN and pick the right join type for the question you're asking.",
    constraints: [
      'No running DB required — write queries on paper.',
      'Use Users(id, name, is_active) and Orders(id, user_id, total_cents, created_at).',
    ],
    steps: [
      'Write a query that lists every order with the user name. What JOIN type did you pick, and why?',
      'Write a query that lists every user and their order count, INCLUDING users with zero orders.',
      'Write a query that lists users who have never placed an order.',
      'For each query, state the expected number of rows given a sample dataset you design.',
      'For each query, identify one index on either table that would likely help.',
    ],
    selfChecks: [
      'Did you pick INNER vs LEFT vs anti-join deliberately?',
      'Does your query 2 correctly include zero-order users (hint: COUNT on the right side column)?',
      'Are your indexes justified by the WHERE/JOIN columns, not random?',
    ],
    rubric: [
      {
        criteria: 'Correct JOIN per question',
        looksLike: 'Q1 INNER, Q2 LEFT JOIN with COUNT on order id, Q3 LEFT JOIN WHERE orders.id IS NULL',
      },
      {
        criteria: 'Row-count predictions',
        looksLike: 'plausible numbers given a designed sample; explains why',
      },
      {
        criteria: 'Reasoned indexes',
        looksLike: 'index on orders.user_id justified by join condition',
      },
    ],
    commonPitfalls: [
      'Using INNER JOIN where LEFT JOIN is needed (loses zero-order users).',
      'COUNT(*) in a LEFT JOIN inflating counts to 1 for zero-match rows.',
      'Adding indexes on every column "just in case".',
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
