import { expect, test } from '@playwright/test';

test.describe('GET /health', () => {
  test('returns { ok: true }', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
