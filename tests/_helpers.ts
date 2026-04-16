import type { APIRequestContext } from '@playwright/test';

/**
 * Shared helpers for the API test suite.
 *
 * Tests should go through `callTool` instead of crafting raw fetches — it
 * matches the wire format of `POST /mcp` and returns the parsed MCPResponse,
 * so the tests stay focused on behavior.
 */

export interface MCPResponse {
  output: any;
  checkpoints: string[];
  tutorNotes?: string;
  hintLadder?: { level: 1 | 2 | 3 | 4; guidance: string };
}

export async function callTool(
  request: APIRequestContext,
  toolName: string,
  input: unknown,
  userContext?: { learnerLevel?: 'beginner' | 'intermediate'; previousTopics?: string[] }
): Promise<MCPResponse> {
  const res = await request.post('/mcp', {
    data: { toolName, input, userContext },
  });
  if (!res.ok()) {
    throw new Error(`tool call failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as MCPResponse;
}

/**
 * Variant that does NOT throw on non-2xx — used by validation-error specs.
 */
export async function callToolRaw(
  request: APIRequestContext,
  toolName: string,
  input: unknown
): Promise<{ status: number; body: any }> {
  const res = await request.post('/mcp', {
    data: { toolName, input },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status(), body };
}
