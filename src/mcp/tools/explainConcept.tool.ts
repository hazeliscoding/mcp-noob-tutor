import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { GLOSSARY, normalizeConcept } from '../../tutor/glossary/glossary';

/**
 * Input contract for the `explain_concept` tool.
 *
 * Supports:
 * - `concept`: the topic to explain (required)
 * - `hintLevel`: 1 (definition) · 2 (demo outline) · 3 (scaffolded pseudocode with blanks)
 *                · 4 (full conceptual walkthrough). Defaults to 1.
 * - `learnerAttempt`: the learner's current attempt. REQUIRED for levels 3 and 4.
 */
interface ExplainConceptInput {
  concept: string;
  hintLevel?: 1 | 2 | 3 | 4;
  learnerAttempt?: string;
}

/**
 * The explain_concept tool: glossary + progressive hint ladder.
 *
 * Flow:
 * 1. Look up concept in glossary (with fallback aliasing for synonyms)
 * 2. If not found: Socratic approach (ask what they think, where they saw it)
 * 3. Hint 1: definition + why it matters + common mistakes
 * 4. Hint 2: demo outline + mini exercise (no full code)
 * 5. Hint 3: scaffolded pseudocode WITH BLANKS — requires learnerAttempt
 * 6. Hint 4: full conceptual walkthrough — requires a meaningful (>30 chars)
 *    learnerAttempt. Still no copy-paste code dump.
 *
 * Why 3/4 are gated by learnerAttempt:
 * - The whole point of the hint ladder is progressive disclosure. A learner
 *   asking for level 4 without attempting anything is the textbook
 *   "just give me the answer" request.
 * - We soft-fail: if they ask for 3+ without attempting, we downgrade to 2
 *   and tell them what's missing. They can try, then re-request.
 *
 * Adding new concepts:
 * - Add entries to src/tutor/glossary/glossary.ts
 * - Update explainConceptInputSchema in src/mcp/schemas/toolSchemas.ts if needed
 * - Add a case in buildDemoOutline() and/or buildScaffold() for tailored hints
 * - (optional) Add aliases in guessAlias() below for synonyms
 */
export const explainConceptTool: MCPTool<ExplainConceptInput> = {
  name: 'explain_concept',

  async execute(input): Promise<MCPResponse> {
    const raw = input.concept;
    const key = normalizeConcept(raw);

    /**
     * Look up the concept in the glossary.
     * Try exact match first, then try aliases (e.g., "swagger" → "rest").
     */
    const entry = GLOSSARY[key] ?? GLOSSARY[guessAlias(key)] ?? null;

    const requestedLevel = input.hintLevel ?? 1;
    const attempt = input.learnerAttempt?.trim() ?? '';

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
     * Hint ladder gate: levels 3 and 4 require a learnerAttempt.
     *
     * - Level 3 demands an attempt (any length) — evidence they started
     * - Level 4 demands a meaningful attempt (>30 chars) — evidence they tried
     *
     * If the gate fails, we downgrade the request to level 2 and explicitly
     * tell the learner what's missing. We don't just error — we still teach.
     */
    const gate = gateLevel(requestedLevel, attempt);
    const hintLevel = gate.effectiveLevel;

    /**
     * Concept found. Hint Level 1: Definition + Why + Common Mistakes.
     */
    if (hintLevel === 1) {
      return {
        output: {
          concept: entry.concept,
          shortDefinition: entry.shortDefinition,
          whyItMatters: entry.whyItMatters,
          commonMistakes: entry.commonMistakes,
          gateNote: gate.note,
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
     */
    if (hintLevel === 2) {
      return {
        output: {
          concept: entry.concept,
          beginnerExample: entry.beginnerExample,
          miniExercise: entry.miniExercise,
          demoOutline: buildDemoOutline(entry.concept),
          gateNote: gate.note,
        },
        checkpoints: [
          'Write down the expected input/output of the demo (even if it’s tiny).',
          'What would you test first to prove it works?',
          'What’s the most likely bug you’ll hit building it?',
        ],
        tutorNotes:
          'Build the demo outline yourself. If you get stuck, paste your attempt and ask for Hint 3 with your attempt.',
        hintLadder: {
          level: 2,
          guidance:
            'Demo outline + mini exercise. Share your learnerAttempt for Hint 3 (scaffolded pseudocode).',
        },
      };
    }

    /**
     * Hint Level 3: Scaffolded Pseudocode with Blanks.
     *
     * We give a pseudocode outline where the hard decisions are left as
     * `// TODO: <question>` placeholders. The learner fills them in; they
     * can't copy-paste a working solution.
     */
    if (hintLevel === 3) {
      return {
        output: {
          concept: entry.concept,
          receivedAttempt: attempt,
          scaffold: buildScaffold(entry.concept),
          reflectionPrompt:
            'Fill in the TODO lines. If a TODO feels impossible, that is a signal — bring that specific TODO to the next message and we will zoom in on it.',
        },
        checkpoints: [
          'For each TODO, write a one-line answer BEFORE touching code.',
          'Which TODO did you have the hardest time with, and why?',
          'What is the SMALLEST test you can write to verify your filled-in scaffold?',
        ],
        tutorNotes:
          'Complete the scaffold yourself. Level 4 unlocks when you bring back a good-faith attempt (>30 chars) showing how you filled it in.',
        hintLadder: {
          level: 3,
          guidance:
            'Scaffolded pseudocode with blanks. Bring a filled-in attempt to unlock Hint 4.',
        },
      };
    }

    /**
     * Hint Level 4: Full conceptual walkthrough.
     *
     * This is the deepest hint. We walk through the reasoning end-to-end in
     * prose, call out the trade-offs, and explicitly say which decisions
     * matter most. We STILL do not paste a copy-pasteable working implementation
     * — this is about deep understanding, not downloadable code.
     */
    return {
      output: {
        concept: entry.concept,
        receivedAttempt: attempt,
        walkthrough: buildWalkthrough(entry.concept),
        tradeoffs:
          'For each step in the walkthrough, identify one alternative approach and why it might be worse or better in your specific case.',
        whenToUse:
          'Under what constraints would your current attempt break? Be specific (scale, failure modes, edge cases).',
      },
      checkpoints: [
        'Summarize the walkthrough in 3 sentences, in your own words, without looking back.',
        'Which step in the walkthrough differs most from your current attempt?',
        'Teach the concept to a rubber duck in under 2 minutes — write the transcript.',
      ],
      tutorNotes:
        'You asked for the deepest hint. Use it to iterate on your attempt, not replace it. Come back with what changed and why.',
      hintLadder: {
        level: 4,
        guidance:
          'Full conceptual walkthrough + trade-offs. After this, the move is to iterate your attempt and self-review.',
      },
    };
  },
};

/**
 * Applies the hint-ladder gate.
 *
 * Returns the `effectiveLevel` (possibly downgraded) and a human-readable
 * `note` explaining the downgrade.
 *
 * Rules:
 * - Level 3 requires a non-empty learnerAttempt.
 * - Level 4 requires a learnerAttempt with >30 trimmed characters (to filter
 *   out "I tried" / "idk" / single-word placeholders).
 * - Anything else passes through.
 */
function gateLevel(
  requested: 1 | 2 | 3 | 4,
  attempt: string
): { effectiveLevel: 1 | 2 | 3 | 4; note: string | null } {
  if (requested === 3 && attempt.length === 0) {
    return {
      effectiveLevel: 2,
      note:
        "Hint 3 requires a 'learnerAttempt'. I'm giving you Hint 2 — try the demo, paste what you built, then re-request Hint 3.",
    };
  }
  if (requested === 4) {
    if (attempt.length === 0) {
      return {
        effectiveLevel: 2,
        note:
          "Hint 4 is the deepest hint and requires a real attempt. I'm giving you Hint 2 — try the demo first, then escalate.",
      };
    }
    if (attempt.length <= 30) {
      return {
        effectiveLevel: 3,
        note:
          "Your learnerAttempt is very short (<=30 chars). I'm giving you Hint 3 (scaffolded pseudocode) instead of Hint 4. Expand your attempt and re-request Hint 4.",
      };
    }
  }
  return { effectiveLevel: requested, note: null };
}

/**
 * Attempt to find a concept by alias.
 *
 * Some concepts have multiple names (e.g., "swagger" and "openapi" for REST docs,
 * or "https" and "tls" for encryption). This maps common aliases to canonical names.
 *
 * If no alias matches, return the original key (caller will check if it exists).
 */
function guessAlias(key: string): string {
  // small aliasing to help beginners who type the phrase they saw in a tutorial
  if (key === 'swagger' || key === 'openapi') return 'rest';
  if (key === 'https' || key === 'tls') return 'http';
  if (key === 'ts' || key === 'type-script') return 'typescript';
  if (key === 'cicd' || key === 'ci/cd' || key === 'ci-cd') return 'ci_cd';
  if (key === 'promise' || key === 'promises' || key === 'await') return 'async';
  if (key === 'authn' || key === 'authz' || key === 'authentication' || key === 'authorization')
    return 'auth';
  if (key === 'cache' || key === 'cdn') return 'caching';
  if (key === 'test' || key === 'tests' || key === 'unit test') return 'testing';
  if (key === 'version control' || key === 'github') return 'git';
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

/**
 * Builds a scaffolded pseudocode outline for a concept.
 *
 * Scaffolds are pseudocode with TODO placeholders — the learner fills in the
 * hard decisions. They can't just copy-paste a solution; they have to think
 * about each TODO.
 *
 * Keep TODO questions specific enough to guide but open enough that a wrong
 * answer reveals a real misunderstanding.
 */
function buildScaffold(concept: string): string[] {
  switch (concept.toLowerCase()) {
    case 'http':
      return [
        'function handleRequest(req):',
        '  // TODO: which HTTP method should this handle, and why?',
        '  // TODO: what is the expected input shape (query params? body?)',
        '  const data = /* TODO: fetch or compute the response data */',
        '  // TODO: what status code does success return?',
        '  // TODO: what Content-Type header is correct here?',
        '  return respond(/* TODO: status */, /* TODO: headers */, /* TODO: body */)',
      ];
    case 'rest':
      return [
        '// resource: <TODO: name, e.g. notes>',
        'GET /<TODO: plural resource>            // list — TODO: pagination shape?',
        'GET /<TODO: plural resource>/:id        // read — TODO: 404 shape?',
        'POST /<TODO: plural resource>           // create — TODO: which body fields?',
        'PATCH /<TODO: plural resource>/:id      // update — TODO: full or partial?',
        'DELETE /<TODO: plural resource>/:id     // remove — TODO: return 204 or 200?',
        '// TODO: write ONE canonical error response shape used by every endpoint',
      ];
    case 'cors':
      return [
        '// Server configuration',
        'const allowedOrigins = [/* TODO: which exact origins? scheme + host + port */]',
        'on OPTIONS <path>:',
        '  // TODO: which Access-Control-Allow-* headers do you send?',
        '  // TODO: what status code does a successful preflight return?',
        'on <other methods>:',
        '  // TODO: add Access-Control-Allow-Origin based on request Origin header',
        '  // TODO: are you setting credentials? (if yes: cannot use *)',
      ];
    case 'sql':
      return [
        '-- You want: list each order with the owning user name',
        'SELECT',
        '  /* TODO: which columns from orders? */,',
        '  /* TODO: which columns from users? */',
        'FROM orders',
        'JOIN users ON /* TODO: which columns match? */',
        '-- TODO: do you need WHERE to filter? What condition?',
        '-- TODO: what ORDER BY makes the result predictable?',
      ];
    case 'jwt':
      return [
        '// On login:',
        '// TODO: which user claims go into the payload (and which do NOT)?',
        'const payload = { /* TODO */ }',
        'const token = sign(payload, /* TODO: which secret/key? where stored? */, {',
        '  expiresIn: /* TODO: how long, and why that long? */',
        '})',
        '// On each protected request:',
        '// TODO: which header carries the token?',
        '// TODO: what exactly does the server verify, in what order?',
        '// TODO: what happens if verification fails?',
      ];
    default:
      return [
        '// Scaffold template — fill in the TODOs:',
        '// TODO: describe the input in one line',
        '// TODO: describe the output in one line',
        '// TODO: list the 2-3 steps to go from input to output',
        '// TODO: name the one edge case most likely to break this',
      ];
  }
}

/**
 * Builds a full conceptual walkthrough for a concept.
 *
 * This is the deepest hint. It walks through the reasoning end-to-end in
 * prose — not code. Think of it as the "what a senior would think before
 * writing the first line" narrative.
 *
 * These are intentionally opinionated: pick one good approach, explain the
 * reasoning, and call out what the alternative would cost.
 */
function buildWalkthrough(concept: string): string[] {
  switch (concept.toLowerCase()) {
    case 'http':
      return [
        "1) Frame the interaction. HTTP is a request/response contract: client asks, server answers. Everything else — methods, status codes, headers, bodies — is a way to make that contract explicit.",
        '2) Pick the method to match intent. GET for safe reads, POST for create, PATCH for partial update, DELETE for removal. If an operation could change data, it is not a GET.',
        '3) Status codes are the first answer. 2xx means success, 4xx means the client asked wrong, 5xx means the server broke. Picking the right code matters more than the body.',
        '4) Headers carry metadata: Content-Type tells what the body is, Authorization carries auth, Cache-Control tells intermediaries what they can cache.',
        '5) Body shape is a contract. Pick JSON and stick with one schema; clients will build tooling around it.',
        '6) The common beginner mistake is treating HTTP as "just a transport". It is a protocol with opinions — align with them and debugging becomes easier.',
      ];
    case 'rest':
      return [
        '1) REST is about resources, not actions. Your URLs describe nouns (users, orders); HTTP methods describe the verbs.',
        '2) Pluralize resource URLs. /users, not /user, not /getUsers. Consistency is the point.',
        '3) Use HTTP methods to their full power: GET (read), POST (create), PATCH (partial), PUT (replace), DELETE (remove). Mixing verbs in URLs (/createUser) is a code smell.',
        '4) Responses need a shape. Define a canonical error body (e.g., { error, message, issues }) once and use it everywhere. Clients will thank you.',
        '5) Pagination is not optional for lists. page/pageSize, or cursor-based — pick one and document it.',
        '6) When REST gets awkward (complex multi-resource actions), that is a signal — either create a sub-resource or reach for a different style (RPC, GraphQL). Do not fight the style.',
      ];
    case 'cors':
      return [
        '1) CORS is enforced by the BROWSER, not the server. The browser refuses to let JavaScript read cross-origin responses unless the server explicitly opts in via headers.',
        '2) Origin = scheme + host + port. http://localhost:3000 and http://localhost:3001 are DIFFERENT origins. This trips everyone.',
        '3) Safe ("simple") requests get sent directly; the browser just gates whether your JS can read the response. "Unsafe" requests (custom headers, non-simple methods) trigger a preflight OPTIONS first.',
        '4) Server must echo an Access-Control-Allow-Origin that matches (or equals *). If you use credentials (cookies), you CANNOT use * — you must name the exact origin.',
        '5) Preflight failures are the #1 confusion. If OPTIONS returns 4xx or lacks the right headers, the real request never fires. Check the Network tab for the red OPTIONS line.',
        '6) curl / Postman bypass this entirely because they are not browsers. "It works in Postman but not the browser" is always a CORS tell.',
      ];
    case 'sql':
      return [
        '1) SQL describes sets. You are not iterating row-by-row — you are declaring the shape of the answer and letting the engine find it.',
        '2) Normalize first, denormalize deliberately. Split data into tables by ownership so one fact lives in one place. Combine with JOINs at read time.',
        '3) JOINs match rows via a shared column (usually a foreign key). INNER JOIN drops unmatched rows, LEFT JOIN keeps the left side even if no match — pick deliberately.',
        '4) WHERE filters rows; GROUP BY collapses them into groups; HAVING filters groups. Use them in that order conceptually.',
        '5) Always run UPDATEs and DELETEs behind a WHERE, and (beginner rule) run the equivalent SELECT first to check what will be affected.',
        '6) Indexes speed reads, slow writes, and cost space. Measure before adding them; understand what your most common query scans before indexing a column.',
      ];
    case 'jwt':
      return [
        '1) A JWT is a SIGNED — not encrypted — token. Anyone can base64-decode and read the payload. Never put a secret in it.',
        '2) Common claims: sub (who), iat (issued at), exp (expires), plus app-specific claims like roles. Keep it small — the token ships on every request.',
        '3) Server signs with a secret on login, client sends it back in Authorization: Bearer <token>. Server verifies signature + exp on every request.',
        '4) Revoke is hard. Without a server-side store, a leaked JWT is valid until exp. Use short exp + refresh tokens if you need quick revoke.',
        '5) Authentication vs authorization: JWT proves WHO you are; it does NOT grant permissions. Always check "can this user do this action" on the server.',
        '6) Storage: cookies with HttpOnly + Secure + SameSite are safer than localStorage for browser clients (not readable by JS, not vulnerable to XSS reads).',
      ];
    default:
      return [
        '1) State the problem in one sentence. If you cannot, you do not understand it yet.',
        '2) Identify the inputs, outputs, and invariants (things that must always be true).',
        '3) Walk the happy path end-to-end in prose. No code.',
        '4) List the 2-3 failure modes. For each, pick the failure behavior (retry? fail loudly? silent default?).',
        '5) Choose ONE approach and write down why the alternatives are worse in your specific case.',
        '6) Only now write code. The code is the easy part; the thinking above is the concept.',
      ];
  }
}
