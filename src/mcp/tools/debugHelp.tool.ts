/**
 * The `debug_help` tool: a Socratic debugging ladder.
 *
 * Philosophy: when a learner is stuck, handing them a fix is the worst thing
 * we can do — they'll paste it, it may work once, and they learn nothing. This
 * tool instead returns:
 *
 *   - `hypotheses`: 3-5 ranked guesses about *why* the error happened
 *   - `checklist`: verification steps the learner runs themselves
 *                  (isolate → reproduce → bisect → add logging)
 *   - `nextBestQuestion`: the ONE question they should answer next
 *
 * The tool never prints code solutions. It pattern-matches well-known error
 * shapes (CORS, 401, ECONNREFUSED, TypeError, etc.) to tailor hypotheses,
 * and falls back to a generic debugging framework when nothing matches.
 *
 * Adding new error patterns:
 * - Extend `knownPatterns` below with a match predicate and hypotheses/checks
 *   tailored to that error family
 */
import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';

/**
 * Input contract for `debug_help`.
 *
 * - `errorText`: raw error/message/stack (required)
 * - `attemptSnippet`: optional small code excerpt for context
 * - `whatYouTried`: optional plain-English summary of attempts so far
 * - `language`: optional language/stack hint (e.g., "typescript", "sql")
 */
interface DebugHelpInput {
  errorText: string;
  attemptSnippet?: string;
  whatYouTried?: string;
  language?: string;
}

/**
 * A single error pattern the tool can recognize.
 *
 * - `label`: short human-friendly name (used in output)
 * - `match`: runs against the (lower-cased) errorText — any truthy match triggers
 * - `hypotheses`: ranked likely causes for this error family
 * - `checklist`: verification steps specific to this family
 * - `nextBestQuestion`: the one question to answer next
 */
interface ErrorPattern {
  label: string;
  match: (text: string) => boolean;
  hypotheses: string[];
  checklist: string[];
  nextBestQuestion: string;
}

/**
 * Well-known error shapes we recognize.
 *
 * Ordered roughly by specificity — we pick the first match. Keep the list
 * focused on patterns beginners hit constantly; generic falls back to the
 * universal ladder below.
 */
const knownPatterns: ErrorPattern[] = [
  {
    label: 'ECONNREFUSED',
    match: (t) => t.includes('econnrefused') || t.includes('connection refused'),
    hypotheses: [
      "The service you're calling isn't running on the host/port you think.",
      "Wrong port in the URL (is it 3333 vs 3000? http vs https?).",
      'A firewall, Docker port mapping, or WSL bridge is swallowing the connection.',
      'You crashed the server earlier and forgot to restart it.',
    ],
    checklist: [
      "Run `curl -v <url>` from the same machine — does it resolve? does it connect?",
      'List listening ports (`lsof -i :3333` / `netstat -an | grep 3333`) — is anything bound there?',
      'Start the server in the foreground and re-run the failing request.',
      'If Docker/WSL: confirm the port is mapped (not just exposed inside the container).',
    ],
    nextBestQuestion:
      'What URL are you calling, and what output does `curl -v <url>` give from the same machine?',
  },
  {
    label: 'EADDRINUSE',
    match: (t) => t.includes('eaddrinuse') || t.includes('address already in use'),
    hypotheses: [
      "Another copy of your server is already holding the port.",
      'A prior run crashed without releasing the port.',
      "You're re-running without killing the previous `node`/`ts-node-dev` process.",
    ],
    checklist: [
      'Find the holder: `lsof -i :<port>` or `ss -lntp | grep <port>`.',
      'Kill it intentionally (don\'t just keep trying a new port).',
      'Confirm your script cleans up on SIGINT/SIGTERM.',
    ],
    nextBestQuestion: 'Which process currently owns the port, and why is it still alive?',
  },
  {
    label: 'CORS',
    match: (t) =>
      t.includes('cors') ||
      t.includes('access-control-allow-origin') ||
      t.includes('has been blocked by cors'),
    hypotheses: [
      "The server isn't sending Access-Control-Allow-Origin for your frontend's origin.",
      'Your request triggers a preflight (OPTIONS) that the server does not handle.',
      "You're using credentials:'include' while the server sends Allow-Origin: *.",
      'The browser actually blocked it, not the server — the request never reached your API.',
    ],
    checklist: [
      'Open DevTools → Network → click the failing request → check for a red OPTIONS line.',
      'Compare response headers from the API (Allow-Origin? Allow-Methods? Allow-Headers?).',
      'Try the exact same request in curl — does it succeed? (If yes, it is a browser policy.)',
      'Confirm the exact origin string (scheme + host + port) matches what the server allows.',
    ],
    nextBestQuestion:
      'What exact origin (scheme://host:port) is the browser sending, and what Access-Control-Allow-Origin is the server returning?',
  },
  {
    label: 'HTTP 401 / auth',
    match: (t) =>
      t.includes('401') || t.includes('unauthorized') || t.includes('invalid token'),
    hypotheses: [
      "Token is missing from the request (no Authorization header).",
      "Token is present but malformed (missing 'Bearer ' prefix).",
      'Token is expired (check `exp` claim).',
      "You're hitting the wrong environment — token from dev, API in prod (or vice versa).",
    ],
    checklist: [
      'Print the Authorization header right before you send it — is it there? Is it intact?',
      'Decode the JWT at jwt.io (paste only the non-sensitive token). Check `iss`, `aud`, `exp`.',
      'Call a public/unauthenticated endpoint — does it work? (Isolates transport vs auth.)',
      'Verify the server is reading Authorization (not a different header) and checking the same signing key.',
    ],
    nextBestQuestion:
      'Is the Authorization header present on the failing request, and does decoding the token show a valid (non-expired) payload?',
  },
  {
    label: 'TypeError: Cannot read properties of undefined',
    match: (t) =>
      t.includes('cannot read properties of undefined') ||
      t.includes("cannot read property") ||
      t.includes('undefined is not an object'),
    hypotheses: [
      "A variable you're dereferencing is undefined (value never set, typo in key, or async race).",
      "An async call returned before you awaited it — the object isn't ready yet.",
      'The API response shape differs from what your code expects.',
      "You're destructuring from a value that's null/undefined.",
    ],
    checklist: [
      'Log the parent object on the line ABOVE the failing line — is it undefined?',
      "If the value comes from an API, log the raw response — does it match your type?",
      'Check for missing await on the call that should produce the value.',
      "If destructuring, add a default: `const { foo = null } = bar ?? {}` and re-run.",
    ],
    nextBestQuestion:
      'On the exact line that throws, what is the parent object (log it) and is it what you expected?',
  },
  {
    label: 'SyntaxError',
    match: (t) => t.includes('syntaxerror'),
    hypotheses: [
      'Unclosed string/brace/paren — look 1-3 lines above the reported line.',
      'Bad JSON (trailing comma, single quotes, unquoted keys).',
      "Wrong module format (ESM `import` in a CommonJS file or vice versa).",
      'Typo near the reported column (missing `;`, stray `}`).',
    ],
    checklist: [
      'Open the exact file and line the error names — not where you thought the bug was.',
      'If JSON, paste it into a validator; fix one issue at a time.',
      'Run `npx tsc --noEmit` (or `node --check file.js`) for a cleaner location.',
    ],
    nextBestQuestion: 'What does the line the error points to look like, and the 2 lines above it?',
  },
  {
    label: 'Module not found',
    match: (t) =>
      t.includes('module not found') ||
      t.includes("cannot find module") ||
      t.includes('err_module_not_found'),
    hypotheses: [
      'Package not installed (forgot `npm install` after pulling).',
      "Relative import path is wrong (extra ../ or missing file extension).",
      "TypeScript path alias not wired up at runtime (aliases compile to TS but break at node).",
      'Case-sensitivity: file is `User.ts`, you imported `./user`.',
    ],
    checklist: [
      'Confirm the file exists at the exact path you imported (case included).',
      'If a package: is it in package.json, and is node_modules populated?',
      'For TS, run the failing file via `npx ts-node <file>` to get a clearer error.',
    ],
    nextBestQuestion: 'What is the exact import statement, and does the target file exist at that path?',
  },
  {
    label: 'Generic TypeError',
    match: (t) => t.includes('typeerror'),
    hypotheses: [
      "You're calling something as a function that isn't one.",
      'Argument types do not match what the function expects.',
      'A method from an older API got renamed/removed.',
    ],
    checklist: [
      'Log `typeof <thing>` right before the failing call.',
      'Check the function signature against its current docs/typings.',
      'Add a minimal reproduction (5-10 lines) outside the app.',
    ],
    nextBestQuestion: 'What is the type of the value right before the failing call (log `typeof`)?',
  },
];

/**
 * The exported tool.
 *
 * This tool is deliberately opinionated: it will NEVER return code, and it
 * front-loads checkpoints that push the learner to paste their attempt before
 * asking again.
 */
export const debugHelpTool: MCPTool<DebugHelpInput> = {
  name: 'debug_help',

  async execute(input): Promise<MCPResponse> {
    const errText = input.errorText ?? '';
    const lower = errText.toLowerCase();
    const pattern = knownPatterns.find((p) => p.match(lower));

    const hypotheses = pattern ? pattern.hypotheses : GENERIC_HYPOTHESES;
    const checklist = pattern ? pattern.checklist : GENERIC_CHECKLIST;
    const nextBestQuestion = pattern
      ? pattern.nextBestQuestion
      : 'Can you reduce the bug to the smallest possible reproduction (10-20 lines) — what does that look like?';

    const matched = pattern?.label ?? null;

    return {
      output: {
        matched,
        language: input.language ?? null,
        summary: pattern
          ? `This looks like ${pattern.label}. Start with the highest-ranked hypothesis and verify it before moving on.`
          : 'No known error pattern matched. Use the generic debugging ladder below — isolate, reproduce, bisect, log.',
        hypotheses,
        checklist,
        nextBestQuestion,
        antiVibeReminder:
          'I will not write a fix for you. Work through the checklist, pick the most likely hypothesis, and come back with what you found.',
      },
      checkpoints: [
        input.attemptSnippet
          ? 'Restate what the snippet is supposed to do in one sentence.'
          : 'Paste the smallest snippet (≤40 lines) that reproduces the error.',
        'Which hypothesis do you think is most likely, and what evidence do you have for it?',
        'What is the simplest experiment you can run next to confirm or reject that hypothesis?',
      ],
      tutorNotes:
        'Pick ONE hypothesis, run the matching checklist item, then tell me what you observed. Do not ask for more help until you have run at least one check.',
      hintLadder: {
        level: 1,
        guidance:
          'Ranked hypotheses + checklist. Ask again with what you observed to unlock more targeted hints.',
      },
    };
  },
};

/**
 * Fallback hypotheses when no known pattern matches.
 *
 * These are the universal debugging failure modes — scope, typos, nulls,
 * async, environment, permissions, types.
 */
const GENERIC_HYPOTHESES = [
  'A variable is undefined/null where you expected a value (typo, missing init, async not awaited).',
  'Scope issue: the name you used is not the name in scope here.',
  'Type mismatch: the value is a different shape than you assume (string vs number, array vs single).',
  'Environment difference: works locally, fails elsewhere (env var, permissions, versions).',
  'Off-by-one / boundary condition (empty array, edge case you did not test).',
];

/**
 * Fallback checklist: the classic 4-step debugging loop.
 *
 * isolate → reproduce → bisect → log. Applied consistently, this finds almost
 * any bug a beginner is likely to hit.
 */
const GENERIC_CHECKLIST = [
  'ISOLATE: remove everything not required to see the bug. What is the smallest failing program?',
  'REPRODUCE: can you trigger the bug on demand? If no, fix that first.',
  'BISECT: comment out / git bisect to find the last time it worked vs the first time it broke.',
  'LOG: add 2-3 strategic log lines around the suspected cause. Print types and raw values, not just labels.',
];
