import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('generate_practice_task', () => {
  test('returns the http-echo-json task for http_basics / easy / 30m', async ({ request }) => {
    const res = await callTool(request, 'generate_practice_task', {
      topic: 'http_basics',
      difficulty: 'easy',
      timeboxMinutes: 30,
    });
    expect(res.output.task.id).toBe('http-echo-json');
    expect(Array.isArray(res.output.task.steps)).toBe(true);
    expect(Array.isArray(res.output.task.rubric)).toBe(true);
  });

  test('returns the cors 15m task', async ({ request }) => {
    const res = await callTool(request, 'generate_practice_task', {
      topic: 'cors_basics',
      difficulty: 'easy',
      timeboxMinutes: 15,
    });
    expect(res.output.task.id).toBe('cors-mental-model');
  });

  test('falls back to 30m when an exact timebox is not in the bank', async ({ request }) => {
    const res = await callTool(request, 'generate_practice_task', {
      topic: 'http_basics',
      difficulty: 'easy',
      timeboxMinutes: 45, // no 45m easy http task exists
    });
    // tool falls back to the easy/30m variant
    expect(res.output.task.id).toBe('http-echo-json');
  });

  test('returns the new medium sql task', async ({ request }) => {
    const res = await callTool(request, 'generate_practice_task', {
      topic: 'sql_basics',
      difficulty: 'medium',
      timeboxMinutes: 45,
    });
    expect(res.output.task.id).toBe('sql-join-medium');
    expect(res.output.task.difficulty).toBe('medium');
  });

  test('unknown topic returns a friendly message', async ({ request }) => {
    const res = await callTool(request, 'generate_practice_task', {
      topic: 'not_a_topic',
    });
    expect(res.output.message).toMatch(/unknown topic/i);
  });
});
