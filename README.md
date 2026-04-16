# mcp-noob-tutor

A Socratic [Model Context Protocol](https://modelcontextprotocol.io) tutor for new coders. It teaches instead of dumping solutions — the whole point is that learners do the thinking, and the tutor hands them the right-sized nudge at the right moment.

## The anti-vibe-coding philosophy

Large language models are _very_ good at writing code you can paste and ship. That is the problem this project exists to push back on. When a learner's first move is "paste my error into a chat and copy whatever comes out", they trade short-term wins for long-term understanding — and the skill they are actually there to build never lands.

So this tutor is deliberately annoying in specific ways:

- **Checkpoints before answers.** Every tool attaches 2-3 questions the learner should answer in their own words before escalating.
- **A 4-level hint ladder.** Level 1 is a definition; level 2 is a demo outline; level 3 is scaffolded pseudocode with `// TODO` blanks; level 4 is a full conceptual walkthrough. Levels 3 and 4 are gated — asking for them without evidence of effort quietly downgrades the response and says why.
- **Rubrics, not rewrites.** `review_submission` walks each rubric criterion and gives _coaching questions_ per item. It never rewrites the learner's code.
- **Debugging as a thinking tool.** `debug_help` returns ranked hypotheses and a verification checklist — not a fix.
- **A central policy layer.** `applyTutorPolicy` inspects every tool response and rewrites it into a guardrail redirect if it looks like a solution dump (multiple code fences + many code-like lines).

None of this prevents a motivated learner from getting a direct answer elsewhere. It just makes the default interaction shape one that teaches.

## Install and run

```bash
npm install
```

There are two transports. Pick the one you want.

### HTTP transport (easy to poke at with curl)

```bash
npm run dev
# server: http://127.0.0.1:3333
# health: http://127.0.0.1:3333/health
# dispatch: POST http://127.0.0.1:3333/mcp
```

### Stdio MCP transport (for Claude Desktop, Cursor, Zed, ...)

```bash
npm run mcp:stdio            # via ts-node
# or, after `npm run build`:
npm run mcp:stdio:build      # runs dist/mcp/stdioEntry.js
```

Stdio mode speaks JSON-RPC 2.0 on stdin/stdout. Diagnostics go to stderr so they never corrupt the RPC channel.

## MCP client config

Register the tutor with any MCP-aware client by pointing it at the built bin. Example `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "noob-tutor": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-noob-tutor/dist/mcp/stdioEntry.js"]
    }
  }
}
```

Cursor and Zed use the same shape in their respective settings files. Run `npm run build` once before the client spawns the subprocess so `dist/mcp/stdioEntry.js` exists.

## Tools

| Name | What it does | When the LLM should call it |
| --- | --- | --- |
| `explain_concept` | Returns a curated definition, common mistakes, and a mini exercise. Supports a 4-rung hint ladder. | Learner asks "what is X" or is fuzzy on a term. |
| `next_topic` | Walks a curriculum track (foundation/frontend/backend/fullstack) and picks the next uncompleted topic. | Learner asks what to study next or just finished a topic. |
| `assess_knowledge` | Returns diagnostic questions for a topic. Does NOT grade. | Learner wants to self-diagnose on a specific topic. |
| `analyze_assessment` | Takes answers + returns gap analysis + a recommended next step. | After the learner has answered `assess_knowledge`. |
| `generate_practice_task` | Returns a timeboxed, rubric-backed practice task. | Learner wants hands-on practice. |
| `debug_help` | Ranked hypotheses, a verification checklist, and the ONE next question. Never writes a fix. | Learner is stuck on an error. |
| `review_submission` | Rubric-driven Socratic feedback against a known practice task. Never rewrites work. | Learner finished a practice task and wants feedback. |

Every tool response passes through `applyTutorPolicy` so the checkpoint shape, hint ladder, and anti-vibe redirect are consistent across the board.

## Example conversations

### 1) Stuck on an error

> Learner: "My fetch keeps failing with `Access to fetch at http://api has been blocked by CORS policy`"

LLM calls `debug_help` with `errorText` — gets back:

- `matched: "CORS"`
- 4 ranked hypotheses (missing Allow-Origin, unhandled preflight, credentials + `*`, browser vs server enforcement)
- A Network-tab checklist
- `nextBestQuestion`: which exact Origin is the browser sending, and what `Access-Control-Allow-Origin` is the server returning?
- Checkpoints forcing the learner to paste their attempt and pick one hypothesis to test first.

No "just add `cors()` middleware" dump.

### 2) Concept escalation

> Learner: "Explain HTTP"  → `explain_concept({ concept: "http", hintLevel: 1 })`

Gets the definition, why it matters, common mistakes, and three reflection checkpoints.

> Later: "Show me the full walkthrough" → `explain_concept({ concept: "http", hintLevel: 4 })` without a `learnerAttempt`.

The tutor downgrades to level 2 with a `gateNote` explaining hint 4 requires a real attempt. Learner tries, comes back with `learnerAttempt: "I built GET /ping returning JSON, verified with curl, but I'm unsure how to pick status codes and what Content-Type really does..."` → now gets the level 4 walkthrough and trade-offs.

### 3) Practice loop

> `generate_practice_task({ topic: "http_basics" })` → `http-echo-json` task (30 min timebox, goal, steps, rubric).

Learner does the work, then `review_submission({ taskId: "http-echo-json", submission: "..." })`.

Each rubric criterion gets a `met`/`partial`/`missing` status plus a coaching question. The tool picks the single most impactful next iteration (`oneThingToImprove`) and — if the learner provided a `selfAssessment` — gently notes where it over- or under-calls their work.

## Architecture

```
HTTP request ── POST /mcp ──┐
                            ▼
                      routes.ts
                    (envelope + tool-input validation via Zod)
                            │
                            ▼
                  mcpController.ts
                  (lookup + context normalization)
                            │
                            ▼
                    tool.execute()
                (explain_concept, next_topic, ...)
                            │
                            ▼
                 applyTutorPolicy
          (default checkpoints, anti-vibe guardrail,
                   hint-ladder attachment)
                            │
                            ▼
                   MCPResponse to caller


MCP client (Claude Desktop / Cursor / Zed)
        │  JSON-RPC 2.0 over stdio
        ▼
  stdioEntry.ts ── bootstrapTools() ── toolRegistry
        │                                  ▲
        └── stdioServer.ts  ──tools/list, tools/call──┘
             (same applyTutorPolicy layer)
```

Both transports share the same tool registry via `src/mcp/bootstrapTools.ts`, so there is exactly one place to register a new tool.

## Adding a new tool

1. Add a Zod input schema in `src/mcp/schemas/toolSchemas.ts` and register it in `toolInputSchemas`.
2. Add a matching JSON Schema entry in `src/mcp/toolJsonSchemas.ts` (this is what MCP clients see).
3. Create `src/mcp/tools/yourTool.tool.ts` exporting an `MCPTool<YourInput>`.
4. Register the tool and its `"Use when …"` description in `src/mcp/bootstrapTools.ts` (two places: the tools array and `TOOL_DESCRIPTIONS`).
5. Add a Playwright spec in `tests/` covering happy path, edge cases, and the "never dumps code" contract.

You do not need to touch `httpServer.ts` or `stdioEntry.ts` — `bootstrapTools()` covers both transports.

## Adding a new topic

1. Extend the `TopicId` union in `src/tutor/curriculum/topicGraph.ts` and add its `TopicNode`.
2. Add it to the appropriate track(s) in `src/tutor/curriculum/tracks.ts`.
3. Optional but encouraged: add a glossary entry (`src/tutor/glossary/glossary.ts`), diagnostic questions (`src/tutor/diagnostics/diagnostics.ts`), and a practice task (`src/tutor/practice/practiceBank.ts`).

## Adding a new practice task

Practice tasks live in `src/tutor/practice/practiceBank.ts`. Each task has a stable `id`, a topic, a timebox (15/30/45/60), and a rubric. `review_submission` uses the rubric's `looksLike` strings for keyword matching, so write them to name the concrete signals you would look for in a strong submission.

## Testing

There are no unit tests in the traditional sense. The Playwright API suite covers every tool over the HTTP transport plus the tutor policy directly.

```bash
npm test          # run the whole suite (auto-boots the dev server)
npm run test:headed  # interactive runner UI
```

The `webServer` hook in `playwright.config.ts` will reuse a running instance, so if you already have `npm run dev` open, tests will use it instead of spawning a second one.

## License

MIT
