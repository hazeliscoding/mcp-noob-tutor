import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('review_submission', () => {
  test('known task returns per-criterion feedback', async ({ request }) => {
    const res = await callTool(request, 'review_submission', {
      taskId: 'http-echo-json',
      submission:
        'I built a GET /ping returning JSON with status 200. I added /fail returning 404. I verified status codes and headers via curl. My responses are always JSON objects.',
    });
    expect(res.output.task.id).toBe('http-echo-json');
    expect(Array.isArray(res.output.rubricFeedback)).toBe(true);
    expect(res.output.rubricFeedback.length).toBeGreaterThan(0);
    for (const f of res.output.rubricFeedback) {
      expect(['met', 'partial', 'missing']).toContain(f.status);
      expect(typeof f.coaching).toBe('string');
    }
    expect(res.output.oneThingToImprove).toBeTruthy();
  });

  test('unknown task id returns a friendly redirect', async ({ request }) => {
    const res = await callTool(request, 'review_submission', {
      taskId: 'not-a-real-task-id',
      submission: 'my homework',
    });
    expect(res.output.message).toMatch(/don't have/i);
  });

  test('partial submission surfaces missing criteria as coaching, not code', async ({
    request,
  }) => {
    const res = await callTool(request, 'review_submission', {
      taskId: 'http-echo-json',
      submission: 'I made some endpoints',
    });
    const serialized = JSON.stringify(res.output);
    // no copy-pasteable code dump allowed
    expect(serialized).not.toContain('```');
    const missing = res.output.rubricFeedback.filter((f: any) => f.status === 'missing');
    // Should have at least one missing criterion given how terse the submission is
    expect(missing.length).toBeGreaterThan(0);
  });

  test('self-assessment agreement is computed when provided', async ({ request }) => {
    const res = await callTool(request, 'review_submission', {
      taskId: 'http-echo-json',
      submission: 'I made some endpoints',
      selfAssessment: 'I think I nailed it perfectly',
    });
    expect(res.output.selfAssessmentAgreement).toBeTruthy();
    expect(String(res.output.selfAssessmentAgreement).toLowerCase()).toMatch(
      /confident|missing|partial|rubric/
    );
  });
});
