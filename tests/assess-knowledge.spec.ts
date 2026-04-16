import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('assess_knowledge', () => {
  test('known topic returns diagnostic questions', async ({ request }) => {
    const res = await callTool(request, 'assess_knowledge', { topic: 'http_basics' });
    expect(res.output.topic).toBe('HTTP Basics');
    expect(Array.isArray(res.output.questions)).toBe(true);
    expect(res.output.questions.length).toBeGreaterThan(0);
    expect(res.output.questions[0]).toHaveProperty('question');
  });

  test('unknown topic returns a friendly redirect', async ({ request }) => {
    const res = await callTool(request, 'assess_knowledge', { topic: 'unicorns_and_rainbows' });
    expect(res.output.message).toMatch(/don't recognize/i);
    expect(res.checkpoints.length).toBeGreaterThan(0);
  });

  test('valid topic without diagnostics returns fallback guidance', async ({ request }) => {
    // internet_basics is a known TopicId but has no DIAGNOSTICS entry.
    const res = await callTool(request, 'assess_knowledge', { topic: 'internet_basics' });
    expect(res.output.topic).toBe('Internet Basics');
    expect(res.output.message).toMatch(/diagnostic questions/i);
  });
});
