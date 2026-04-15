/**
 * The `review_submission` tool: rubric-driven Socratic feedback.
 *
 * Flow:
 * 1. Learner submits work against a task they were given by generate_practice_task
 * 2. Tool looks up the task by id in the practice bank
 * 3. For each rubric criterion, it heuristically decides whether the submission
 *    `met`, `partial`ly met, or `missing`ly addressed the criterion, based on
 *    keyword presence from the criterion's `looksLike` string.
 * 4. For each criterion it returns ONE coaching question (never a rewrite).
 * 5. It surfaces 1-3 strengths, ONE thing to improve, and (if provided) notes
 *    where it agrees/disagrees with the learner's self-assessment.
 *
 * Non-negotiable rules baked in:
 * - NEVER return a rewritten submission.
 * - NEVER paste corrected code.
 * - Only questions + nudges. The learner must do the iteration.
 *
 * The keyword heuristic is intentionally simple — accurate enough for beginner
 * practice tasks, and easy to replace with an LLM classifier later.
 */
import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import {
  pickPracticeTaskById,
  type PracticeTask,
} from '../../tutor/practice/practiceBank';

/**
 * Input contract for `review_submission`.
 *
 * - `taskId`: id of the task the learner was working on (required)
 * - `submission`: plain-text dump of what they did (required)
 * - `selfAssessment`: optional — their own read on how they did
 */
interface ReviewSubmissionInput {
  taskId: string;
  submission: string;
  selfAssessment?: string;
}

/**
 * Per-criterion status levels.
 *
 * - `met`: strong keyword coverage, submission addresses the criterion
 * - `partial`: weak or ambiguous coverage, something is there but unclear
 * - `missing`: no signal in the submission
 */
type CriterionStatus = 'met' | 'partial' | 'missing';

interface RubricFeedback {
  criteria: string;
  status: CriterionStatus;
  coaching: string;
}

/**
 * The exported tool. Lookup-by-id, heuristic scoring, Socratic coaching.
 */
export const reviewSubmissionTool: MCPTool<ReviewSubmissionInput> = {
  name: 'review_submission',

  async execute(input): Promise<MCPResponse> {
    const { taskId, submission, selfAssessment } = input;
    const task = pickPracticeTaskById(taskId);

    if (!task) {
      return {
        output: {
          message: `I don't have a practice task with id "${taskId}".`,
          suggestion:
            'Run generate_practice_task first to get a task, then submit against its id.',
        },
        checkpoints: [
          'Did you copy the id exactly from the practice task you received?',
          'Do you want me to list available practice tasks?',
        ],
      };
    }

    const submissionLower = submission.toLowerCase();
    const rubricFeedback: RubricFeedback[] = task.rubric.map((r) => {
      const status = scoreCriterion(r.looksLike, submissionLower);
      return {
        criteria: r.criteria,
        status,
        coaching: coachingFor(r.criteria, r.looksLike, status),
      };
    });

    const strengths = pickStrengths(rubricFeedback, task);
    const oneThingToImprove = pickOneThingToImprove(rubricFeedback, task);
    const selfAssessmentAgreement = selfAssessment
      ? compareSelfAssessment(rubricFeedback, selfAssessment)
      : null;

    return {
      output: {
        task: {
          id: task.id,
          title: task.title,
          goal: task.goal,
        },
        rubricFeedback,
        strengths,
        oneThingToImprove,
        selfAssessmentAgreement,
        antiVibeReminder:
          "I'm not going to rewrite your submission. Use the coaching questions to take one more pass yourself, then resubmit.",
      },
      checkpoints: [
        'Pick the ONE criterion marked "missing" or "partial" that feels most impactful — what will you change first?',
        'Which coaching question would you rather answer in writing before touching code?',
        'What did you learn from this pass that you want to carry into the next task?',
      ],
      tutorNotes:
        'Iterate once on the "oneThingToImprove" and resubmit with a brief note on what you changed and why.',
      hintLadder: {
        level: 2,
        guidance:
          'Rubric-based feedback + coaching questions. Resubmit with your iteration; ask for Hint 3 only after an honest attempt.',
      },
    };
  },
};

/**
 * Heuristic keyword-based scoring.
 *
 * Splits the criterion's `looksLike` string into salient tokens (length >= 3,
 * lowercased, stripped of punctuation) and measures how many appear in the
 * submission. Coverage translates to status:
 *
 *   - >= 60% tokens present → met
 *   - 20%–60%               → partial
 *   - < 20%                 → missing
 *
 * This is an intentionally dumb classifier. It's good enough for beginner
 * practice tasks and trivially swappable for an LLM later.
 */
function scoreCriterion(looksLike: string, submissionLower: string): CriterionStatus {
  const tokens = tokenize(looksLike);
  if (tokens.length === 0) return 'partial';

  const hits = tokens.filter((t) => submissionLower.includes(t));
  const ratio = hits.length / tokens.length;

  if (ratio >= 0.6) return 'met';
  if (ratio >= 0.2) return 'partial';
  return 'missing';
}

/**
 * Tokenizes a phrase into lower-cased alphanumeric tokens of length >= 3.
 *
 * Drops stop-words and short glue words — they don't carry signal.
 */
function tokenize(text: string): string[] {
  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'than',
    'but',
    'not',
    'are',
    'was',
    'you',
    'your',
    'its',
    'they',
    'them',
    'their',
    'any',
    'all',
    'one',
    'two',
    'has',
    'have',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_/]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stop.has(t));
}

/**
 * Picks a coaching question per criterion — one thoughtful question, never a rewrite.
 *
 * Different status buckets get different framing:
 * - `met`: probe deeper so they can teach it back
 * - `partial`: point to the specific gap and ask for a concrete next step
 * - `missing`: ask why they think it wasn't addressed (often reveals misunderstanding)
 */
function coachingFor(criteria: string, looksLike: string, status: CriterionStatus): string {
  switch (status) {
    case 'met':
      return `You seem to cover "${criteria}". Can you explain it to a rubber duck in your own words so I know you got it?`;
    case 'partial':
      return `Parts of "${criteria}" are there. A strong answer looks like: ${looksLike}. What is the smallest edit that gets you the rest of the way?`;
    case 'missing':
      return `I don't see "${criteria}" in your submission. Was that intentional, or did the task requirement not register? Try answering: what would ${looksLike.toLowerCase()} look like for your case?`;
  }
}

/**
 * Picks up to 3 strengths — criteria that were scored `met`.
 *
 * Falls back to task-level praise if nothing was met, so the learner doesn't
 * get a blank "no strengths" wall.
 */
function pickStrengths(feedback: RubricFeedback[], task: PracticeTask): string[] {
  const met = feedback.filter((f) => f.status === 'met').map((f) => f.criteria);
  if (met.length > 0) return met.slice(0, 3);
  return [`You attempted ${task.title} — that's the hardest part. Let's sharpen a few things.`];
}

/**
 * Picks the single most impactful next iteration.
 *
 * Preference order: missing > partial > met. Within a bucket, the first
 * rubric criterion (rubrics are ordered most-important-first by convention).
 */
function pickOneThingToImprove(feedback: RubricFeedback[], task: PracticeTask): string {
  const missing = feedback.find((f) => f.status === 'missing');
  if (missing) return `Address: ${missing.criteria}. ${missing.coaching}`;

  const partial = feedback.find((f) => f.status === 'partial');
  if (partial) return `Tighten: ${partial.criteria}. ${partial.coaching}`;

  return `All criteria look covered. Try this: rewrite your submission as a 3-bullet summary teaching "${task.title}" to someone who has never heard of it.`;
}

/**
 * Compares the learner's self-assessment to the tool's rubric findings.
 *
 * Deliberately gentle — we don't want to call a learner "wrong" about their own
 * work. We look for mismatches between the overall tone of their self-assessment
 * and the rubric results.
 */
function compareSelfAssessment(feedback: RubricFeedback[], selfAssessment: string): string {
  const self = selfAssessment.toLowerCase();
  const tooHarshTokens = ['terrible', 'awful', 'failed', 'bad', 'nothing', 'useless'];
  const tooRosyTokens = ['perfect', 'nailed it', 'flawless', 'great', 'done', 'complete'];

  const meetsCount = feedback.filter((f) => f.status === 'met').length;
  const missCount = feedback.filter((f) => f.status === 'missing').length;

  if (tooHarshTokens.some((t) => self.includes(t)) && meetsCount >= 1) {
    return `You were harder on yourself than the rubric suggests — ${meetsCount} criteria look met. Where did the harshness come from?`;
  }
  if (tooRosyTokens.some((t) => self.includes(t)) && missCount >= 1) {
    return `Your self-assessment sounds confident, but ${missCount} criteria look missing or partial. What might you have missed?`;
  }
  return 'Your self-assessment broadly aligns with the rubric feedback. Keep calibrating — that skill compounds.';
}
