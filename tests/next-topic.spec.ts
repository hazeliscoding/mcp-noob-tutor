import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('next_topic', () => {
  const tracks = ['foundation', 'frontend', 'backend', 'fullstack'] as const;
  for (const track of tracks) {
    test(`returns a next topic for track=${track}`, async ({ request }) => {
      const res = await callTool(request, 'next_topic', { track });
      expect(res.output.track).toBe(track);
      expect(res.output.nextTopic?.id).toBeTruthy();
      expect(typeof res.output.nextTopic?.title).toBe('string');
      expect(Array.isArray(res.output.studyPlan)).toBe(true);
    });
  }

  test('defaults to fullstack when track is omitted', async ({ request }) => {
    const res = await callTool(request, 'next_topic', {});
    expect(res.output.track).toBe('fullstack');
  });

  test('respects currentTopic (marks it as completed)', async ({ request }) => {
    const baseline = await callTool(request, 'next_topic', { track: 'foundation' });
    const baselineId = baseline.output.nextTopic.id;

    const afterFinish = await callTool(request, 'next_topic', {
      track: 'foundation',
      currentTopic: baselineId,
    });
    expect(afterFinish.output.nextTopic.id).not.toBe(baselineId);
  });
});
