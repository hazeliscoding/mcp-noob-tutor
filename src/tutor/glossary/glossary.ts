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

  git: {
    concept: 'Git',
    shortDefinition:
      'Git is a version control system that tracks snapshots of your files as commits on branches.',
    whyItMatters:
      "Teams only scale when changes are reviewable, reversible, and parallelizable. Git provides all three.",
    commonMistakes: [
      'Committing on main directly instead of branching.',
      'Using git add -A and accidentally committing secrets (.env, credentials).',
      "Force-pushing to shared branches (destroys teammates' work).",
      'Treating commits as "save" — huge commits mixing unrelated changes.',
    ],
    beginnerExample:
      'Create a branch (git checkout -b feat/login), make small commits, open a PR, review, merge.',
    miniExercise:
      'Explain in one paragraph: what is the difference between git fetch, git pull, and git merge?',
  },

  testing: {
    concept: 'Testing',
    shortDefinition:
      'Automated tests assert that your code behaves as intended, so you can change it later without fear.',
    whyItMatters:
      'Tests are how you prove behavior stays correct as the codebase grows. Without them, every change is a gamble.',
    commonMistakes: [
      'Testing implementation details (how) instead of behavior (what).',
      'Writing only happy-path tests — no error/edge cases.',
      'One giant E2E test instead of a pyramid of small units + a few integrations.',
      'Mocks that are more complex than the code under test.',
    ],
    beginnerExample:
      'For a function add(a, b): test(add(2,3)===5), test(add(-1,1)===0), test throws on non-numbers.',
    miniExercise:
      'Name the three layers of the test pyramid and which should be most numerous.',
  },

  ci_cd: {
    concept: 'CI/CD',
    shortDefinition:
      'Continuous Integration runs your tests on every push; Continuous Delivery/Deployment ships passing code to users automatically.',
    whyItMatters:
      'CI catches regressions before they reach main; CD makes shipping boring (which is the goal).',
    commonMistakes: [
      'Letting the pipeline stay red for days (normalizes broken main).',
      'Skipping tests locally because "CI will catch it".',
      "Deploying directly from laptops instead of from the pipeline — state drifts.",
      'No rollback strategy; a bad deploy becomes a crisis.',
    ],
    beginnerExample:
      'GitHub Actions: on push → install → lint → test → build. On push to main, deploy to staging.',
    miniExercise:
      "What's the minimum gate that should block a PR from merging, and why?",
  },

  caching: {
    concept: 'Caching',
    shortDefinition:
      'Caching stores the result of an expensive operation so the next caller can reuse it instead of recomputing.',
    whyItMatters:
      'Caching is the cheapest way to make slow systems feel fast — but wrong caching makes bugs hilariously hard to find.',
    commonMistakes: [
      "Caching data that must be fresh (stale writes wreck users' trust).",
      'No TTL or invalidation strategy — stale forever.',
      'Caching per-user data in a shared cache (privacy leak).',
      'Using cache to fix a query that should have been indexed.',
    ],
    beginnerExample:
      'Browser caches static JS via Cache-Control: max-age=31536000; server caches expensive DB rollups for 60 seconds.',
    miniExercise:
      'Name one piece of data in any app you use that MUST NOT be cached, and explain why.',
  },

  auth: {
    concept: 'Auth',
    shortDefinition:
      '"Auth" is shorthand for two distinct things: authentication (who you are) and authorization (what you can do).',
    whyItMatters:
      'Conflating them is the root of most auth bugs. A logged-in user is not necessarily an allowed user.',
    commonMistakes: [
      'Using the words "auth" / "authentication" / "authorization" interchangeably.',
      'Checking authentication but forgetting authorization (any logged-in user can hit admin routes).',
      'Trusting the client to enforce permissions.',
      'Storing passwords unhashed or with weak/outdated hashes.',
    ],
    beginnerExample:
      'Login → authenticates (sets session/JWT). Hitting /admin/users → authorizes (is this user an admin?).',
    miniExercise:
      'Give one example each of an authentication failure and an authorization failure in the same app.',
  },

  api: {
    concept: 'API',
    shortDefinition:
      'An API is the contract between two programs — the set of requests one side can make and the shape of the answers.',
    whyItMatters:
      'Every app is really a network of APIs. Understanding the contract mindset scales from a single function to distributed systems.',
    commonMistakes: [
      'Breaking the contract silently (removing a field, changing a type).',
      'No versioning strategy — every change is a potential break.',
      'Leaking internal implementation details through the API shape.',
      'Inconsistent naming, casing, and error shapes across endpoints.',
    ],
    beginnerExample:
      'A library function is a local API; a REST endpoint is a network API. Both define inputs, outputs, and errors.',
    miniExercise:
      'Pick an app you use. Name one operation you do there and sketch the API call(s) you imagine behind it.',
  },

  typescript: {
    concept: 'TypeScript',
    shortDefinition:
      'TypeScript is JavaScript with a layer of static type annotations that the compiler checks before your code runs.',
    whyItMatters:
      'Types are executable documentation. They catch a whole class of bugs at compile time and make refactoring safe.',
    commonMistakes: [
      'Using `any` everywhere, defeating the point.',
      'Fighting the type system with `as` casts instead of modeling the data correctly.',
      'Treating `unknown` and `any` as the same.',
      'Ignoring strict mode flags (`strict: true` should be table stakes).',
    ],
    beginnerExample:
      'function add(a: number, b: number): number { return a + b } — call add("1", 2) fails at compile time.',
    miniExercise:
      "What's the practical difference between `any` and `unknown`? Which should you prefer, and why?",
  },

  async: {
    concept: 'Async',
    shortDefinition:
      "Async code represents work that doesn't complete immediately — it returns a handle (Promise) you can await later.",
    whyItMatters:
      'I/O, timers, and network calls are all async. Misunderstanding async is the #1 source of "why is this undefined?" bugs.',
    commonMistakes: [
      'Forgetting await — you get a Promise object, not the value.',
      'Mixing then/callbacks with await in the same flow.',
      'Not handling rejections (unhandled rejection warnings at runtime).',
      'Awaiting in a loop when Promise.all would parallelize safely.',
    ],
    beginnerExample:
      "const data = await fetch(url).then(r => r.json()) — fetch returns a Promise of Response, .json() returns another Promise.",
    miniExercise:
      'Write pseudocode for "fetch 3 URLs in parallel, fail fast if any one fails". Which Promise helper do you use?',
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
