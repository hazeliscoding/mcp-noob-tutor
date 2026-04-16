import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('debug_help', () => {
  test('matches ECONNREFUSED pattern', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText: 'Error: connect ECONNREFUSED 127.0.0.1:3333',
    });
    expect(res.output.matched).toBe('ECONNREFUSED');
    expect(res.output.hypotheses.length).toBeGreaterThan(0);
    expect(typeof res.output.nextBestQuestion).toBe('string');
  });

  test('matches CORS pattern', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText:
        'Access to fetch at http://api.example.com has been blocked by CORS policy: No Access-Control-Allow-Origin header',
    });
    expect(res.output.matched).toBe('CORS');
    expect(res.output.hypotheses.some((h: string) => h.toLowerCase().includes('preflight'))).toBe(
      true
    );
  });

  test('matches 401/auth pattern', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText: 'HTTP 401 Unauthorized: invalid token',
    });
    expect(res.output.matched).toBe('HTTP 401 / auth');
  });

  test('matches TypeError: Cannot read properties of undefined', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText: "TypeError: Cannot read properties of undefined (reading 'name')",
    });
    expect(res.output.matched).toBe('TypeError: Cannot read properties of undefined');
  });

  test('falls back to generic ladder when nothing matches', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText: 'something weird happened with the vibes',
    });
    expect(res.output.matched).toBeNull();
    expect(res.output.hypotheses.length).toBeGreaterThan(0);
    expect(res.output.checklist.length).toBeGreaterThan(0);
  });

  test('never pastes a code solution', async ({ request }) => {
    const res = await callTool(request, 'debug_help', {
      errorText: 'CORS blocked my request',
    });
    const serialized = JSON.stringify(res.output);
    // no code fences — we should never dump copy-pasteable solutions
    expect(serialized).not.toContain('```');
    // explicit reminder should be present
    expect(res.output.antiVibeReminder).toBeTruthy();
  });
});
