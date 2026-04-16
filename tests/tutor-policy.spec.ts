import { expect, test } from '@playwright/test';
import { applyTutorPolicy } from '../src/tutor/tutorPolicy';
import type { MCPResponse } from '../src/shared/types';

/**
 * Unit-style Playwright spec for `applyTutorPolicy`.
 *
 * We import the policy fn directly — no HTTP needed. This gives us a fast,
 * deterministic way to prove the anti-vibe guardrail triggers on solution
 * dumps and is a no-op on normal tutor responses.
 */

test.describe('applyTutorPolicy', () => {
  test('attaches default checkpoints + tutorNotes + hintLadder when tool omits them', async () => {
    const raw: MCPResponse = {
      output: { note: 'some structured output' },
      checkpoints: [],
    };
    const res = applyTutorPolicy(raw, { toolName: 'explain_concept', learnerLevel: 'beginner' });
    expect(res.checkpoints.length).toBeGreaterThan(0);
    expect(res.tutorNotes?.length ?? 0).toBeGreaterThan(0);
    expect(res.hintLadder).toBeTruthy();
    expect(res.hintLadder?.level).toBe(1);
  });

  test('passes through tool-provided checkpoints + hintLadder', async () => {
    const raw: MCPResponse = {
      output: { message: 'anything' },
      checkpoints: ['my custom checkpoint'],
      tutorNotes: 'my notes',
      hintLadder: { level: 2, guidance: 'custom guidance' },
    };
    const res = applyTutorPolicy(raw, { toolName: 'explain_concept', learnerLevel: 'beginner' });
    expect(res.checkpoints).toEqual(['my custom checkpoint']);
    expect(res.tutorNotes).toBe('my notes');
    expect(res.hintLadder?.level).toBe(2);
  });

  test('anti-vibe guardrail triggers on a large code-dump output', async () => {
    // Build a fake "solution dump": two code fences + many code-like lines.
    const codeBlock = Array.from({ length: 40 }, (_, i) => `const x${i} = ${i};`).join('\n');
    const bigDump = '```ts\n' + codeBlock + '\n```\n```ts\n' + codeBlock + '\n```';
    const raw: MCPResponse = {
      output: bigDump,
      checkpoints: [],
    };
    const res = applyTutorPolicy(raw, { toolName: 'explain_concept', learnerLevel: 'beginner' });
    // Guardrail replaces output with a structured redirect object
    expect(typeof res.output).toBe('object');
    expect((res.output as any).message).toMatch(/not going to dump/i);
    expect(Array.isArray((res.output as any).nextSteps)).toBe(true);
    expect(res.tutorNotes).toMatch(/guardrail/i);
    expect(res.hintLadder?.level).toBe(1);
  });

  test('normal small output does not trigger the guardrail', async () => {
    const raw: MCPResponse = {
      output: {
        concept: 'HTTP',
        shortDefinition: 'short definition',
        commonMistakes: ['one', 'two'],
      },
      checkpoints: ['real checkpoint'],
    };
    const res = applyTutorPolicy(raw, { toolName: 'explain_concept', learnerLevel: 'beginner' });
    // Output untouched
    expect(res.output).toEqual({
      concept: 'HTTP',
      shortDefinition: 'short definition',
      commonMistakes: ['one', 'two'],
    });
  });
});
