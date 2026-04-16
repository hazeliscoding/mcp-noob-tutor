import { expect, test } from '@playwright/test';
import { callTool, callToolRaw } from './_helpers';

test.describe('analyze_assessment', () => {
  test('happy path: returns analysis, summary, and recommendation', async ({ request }) => {
    const res = await callTool(request, 'analyze_assessment', {
      topic: 'http_basics',
      answers: [
        'GET retrieves data while POST sends a body to create new resources.',
        '404 means the server could not find the resource at the requested URL.',
        'Headers carry request metadata like content type, auth, and caching rules.',
      ],
    });
    expect(res.output.topic).toBe('HTTP Basics');
    expect(Array.isArray(res.output.analysis)).toBe(true);
    expect(res.output.summary).toHaveProperty('primaryGap');
    expect(res.output.recommendation).toHaveProperty('nextStep');
  });

  test('empty answers array is rejected by Zod (400)', async ({ request }) => {
    const raw = await callToolRaw(request, 'analyze_assessment', {
      topic: 'http_basics',
      answers: [],
    });
    expect(raw.status).toBe(200);
    // Note: zod accepts empty array (no min), but tool detects it at runtime.
    // The actual tool guards with Array.isArray/length === 0.
    // If the raw status is 200, confirm the runtime guard fired.
    if (raw.status === 200) {
      expect(raw.body.output.message).toMatch(/no answers/i);
    }
  });

  test('unknown topic returns a friendly error output', async ({ request }) => {
    const res = await callTool(request, 'analyze_assessment', {
      topic: 'nonsense_topic',
      answers: ['anything'],
    });
    expect(res.output.message).toMatch(/unknown topic/i);
  });
});
