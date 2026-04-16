import { expect, test } from '@playwright/test';
import { callTool } from './_helpers';

test.describe('explain_concept', () => {
  test('known concept returns definition at level 1', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 1,
    });
    expect(res.output.concept).toBe('HTTP');
    expect(typeof res.output.shortDefinition).toBe('string');
    expect(Array.isArray(res.output.commonMistakes)).toBe(true);
    expect(res.hintLadder?.level).toBe(1);
    expect(res.checkpoints.length).toBeGreaterThan(0);
  });

  test('level 2 returns demo outline + mini exercise (no full code)', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 2,
    });
    expect(Array.isArray(res.output.demoOutline)).toBe(true);
    expect(res.output.demoOutline.length).toBeGreaterThan(0);
    expect(typeof res.output.miniExercise).toBe('string');
    expect(res.hintLadder?.level).toBe(2);
  });

  test('level 3 without learnerAttempt is downgraded to level 2', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 3,
    });
    expect(res.hintLadder?.level).toBe(2);
    expect(res.output.gateNote).toBeTruthy();
    expect(String(res.output.gateNote)).toMatch(/learnerAttempt/i);
  });

  test('level 3 with learnerAttempt unlocks scaffolded pseudocode', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 3,
      learnerAttempt: 'I built a GET /ping that returns { ok: true } but not sure about statuses.',
    });
    expect(res.hintLadder?.level).toBe(3);
    expect(Array.isArray(res.output.scaffold)).toBe(true);
    expect(res.output.scaffold.some((l: string) => l.includes('TODO'))).toBe(true);
  });

  test('level 4 with short learnerAttempt is downgraded to level 3', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 4,
      learnerAttempt: 'tried it',
    });
    expect(res.hintLadder?.level).toBe(3);
  });

  test('level 4 with a real attempt returns full conceptual walkthrough', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'http',
      hintLevel: 4,
      learnerAttempt:
        'I wrote GET /ping returning JSON, verified with curl (200), and tried a 404 for /fail but I am unsure what headers matter and how to pick a status code deliberately.',
    });
    expect(res.hintLadder?.level).toBe(4);
    expect(Array.isArray(res.output.walkthrough)).toBe(true);
    expect(res.output.walkthrough.length).toBeGreaterThan(0);
  });

  test('unknown concept falls back to Socratic prompts', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'quantum-bogosort',
    });
    expect(res.output.message).toMatch(/glossary/i);
    expect(res.checkpoints.length).toBeGreaterThan(0);
  });

  test('alias routes to canonical concept (promise -> async)', async ({ request }) => {
    const res = await callTool(request, 'explain_concept', {
      concept: 'promise',
    });
    expect(res.output.concept).toBe('Async');
  });
});
