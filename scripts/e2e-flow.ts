// scripts/e2e-flow.ts
//
// End-to-end flow runner for your MCP tutor server:
// 1) assess_knowledge(topic)
// 2) analyze_assessment(topic, answers[])
// 3) auto-follow recommendation (if it points to explain_concept / next_topic)

type LearnerLevel = 'beginner' | 'intermediate';

interface MCPRequest {
  toolName: string;
  input: unknown;
  userContext?: {
    learnerLevel?: LearnerLevel;
    previousTopics?: string[];
  };
}

interface MCPResponse {
  output: any;
  checkpoints: string[];
  tutorNotes?: string;
  hintLadder?: {
    level: 1 | 2 | 3 | 4;
    guidance: string;
  };
}

interface HttpErrorBody {
  error?: string;
  message?: string;
  issues?: Array<{ path: string; message: string }>;
}

const HOST = process.env.MCP_HOST ?? 'http://127.0.0.1:3333';
const MCP_ENDPOINT = `${HOST}/mcp`;

function divider(title: string) {
  console.log('\n' + '-'.repeat(80));
  console.log(title);
  console.log('-'.repeat(80));
}

function pretty(obj: unknown) {
  console.log(JSON.stringify(obj, null, 2));
}

async function postMcp(req: MCPRequest): Promise<MCPResponse> {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    let body: HttpErrorBody | string = '';
    try {
      body = (await res.json()) as HttpErrorBody;
    } catch {
      body = await res.text();
    }

    const err = new Error(
      `HTTP ${res.status} calling ${MCP_ENDPOINT}: ${
        typeof body === 'string' ? body : (body.message ?? body.error ?? 'Unknown error')
      }`
    );
    (err as any).details = body;
    throw err;
  }

  return (await res.json()) as MCPResponse;
}

function extractRecommendation(resp: MCPResponse) {
  // From Commit 8, analyze_assessment returns:
  // output.recommendation = { nextStep, hintLevel?, payload?, ... }
  return resp?.output?.recommendation ?? null;
}

async function main() {
  // === Customize these ===
  const learnerLevel: LearnerLevel = 'beginner';
  const topic = (process.env.TOPIC ?? 'http_basics') as string;

  // Provide answers for analyze_assessment (in order of questions returned by assess_knowledge).
  // You can override via env var ANSWERS_JSON='["a1","a2","a3"]'
  const answers: string[] = process.env.ANSWERS_JSON
    ? JSON.parse(process.env.ANSWERS_JSON)
    : [
        'GET is used to retrieve data; POST is used to send data to create something.',
        "404 means the resource wasn't found on the server.",
        'Headers are key/value metadata sent with the request and response.',
      ];

  const previousTopics = (process.env.PREVIOUS_TOPICS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  divider('0) Server sanity check: GET /health (optional)');
  // Optional: you can uncomment if you add a health fetch. Keeping minimal.

  divider(`1) assess_knowledge(topic=${topic})`);
  const assessReq: MCPRequest = {
    toolName: 'assess_knowledge',
    input: { topic },
    userContext: { learnerLevel, previousTopics },
  };

  const assessResp = await postMcp(assessReq);
  pretty({
    output: assessResp.output,
    checkpoints: assessResp.checkpoints,
    tutorNotes: assessResp.tutorNotes,
    hintLadder: assessResp.hintLadder,
  });

  divider(`2) analyze_assessment(topic=${topic})`);
  const analyzeReq: MCPRequest = {
    toolName: 'analyze_assessment',
    input: { topic, answers },
    userContext: { learnerLevel, previousTopics },
  };

  const analyzeResp = await postMcp(analyzeReq);
  pretty({
    output: analyzeResp.output,
    checkpoints: analyzeResp.checkpoints,
    tutorNotes: analyzeResp.tutorNotes,
    hintLadder: analyzeResp.hintLadder,
  });

  const recommendation = extractRecommendation(analyzeResp);

  divider('3) Follow recommendation (auto)');
  if (!recommendation) {
    console.log('No recommendation found in analyze_assessment response. Stopping.');
    return;
  }

  console.log('Recommendation:');
  pretty(recommendation);

  // Normalize the recommended next call
  const nextStep: string | undefined = recommendation.nextStep;
  if (!nextStep) {
    console.log('Recommendation missing nextStep. Stopping.');
    return;
  }

  // - "explain_concept"
  // - "practice_task" (not implemented yet)
  // - "next_topic"
  //
  // We'll call /mcp with the corresponding toolName if supported.
  if (nextStep === 'practice_task') {
    console.log(
      "practice_task recommended, but it isn't implemented yet. (This will land in a later commit.)"
    );
    return;
  }

  const toolName = nextStep;

  // terminology -> payload: { concept: topic }
  // conceptual  -> payload: { concept: topic, hintLevel: 2 }
  // next_topic  -> no payload (or could add track)
  const payload = recommendation.payload ?? {};

  const followReq: MCPRequest = {
    toolName,
    input: payload,
    userContext: { learnerLevel, previousTopics },
  };

  const followResp = await postMcp(followReq);
  pretty({
    output: followResp.output,
    checkpoints: followResp.checkpoints,
    tutorNotes: followResp.tutorNotes,
    hintLadder: followResp.hintLadder,
  });

  divider('Done ✅');
}

main().catch((err) => {
  console.error('\nE2E flow failed ❌');
  console.error(err instanceof Error ? err.message : err);

  const details = (err as any)?.details;
  if (details) {
    console.error('\nDetails:');
    pretty(details);
  }

  process.exit(1);
});

/*
Usage examples:
  npm run e2e
  TOPIC=cors_basics npm run e2e
  ANSWERS_JSON='["a1","a2","a3"]' TOPIC=http_basics npm run e2e
*/
