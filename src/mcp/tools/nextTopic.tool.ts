import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { TOPICS, isTopicId, type TopicId } from '../../tutor/curriculum/topicGraph';
import { TRACKS } from '../../tutor/curriculum/tracks';

/**
 * The "next topic" tool — guides learners through a structured curriculum.
 *
 * How it works:
 * 1. Learner picks a track (foundation/frontend/backend/fullstack)
 * 2. We check what they've already completed (from `ctx.previousTopics`)
 * 3. We walk the track's ordered list and pick the first uncompleted topic
 * 4. We return that topic + checkpoints to ensure active learning
 *
 * If they've completed the track, we suggest practice projects or switching tracks.
 *
 * Design notes:
 * - Tracks are linear for simplicity (good for beginners)
 * - Later we can add branching (e.g., "pick React or Vue")
 * - Prerequisites are validated but not strictly enforced (learners can skip ahead if they want)
 */

interface NextTopicInput {
  track?: 'foundation' | 'frontend' | 'backend' | 'fullstack';
  currentTopic?: string; // optional; can be a TopicId
}

export const nextTopicTool: MCPTool<NextTopicInput> = {
  name: 'next_topic',

  async execute(input, ctx): Promise<MCPResponse> {
    const track = input.track ?? 'fullstack';
    const previous = new Set(ctx.previousTopics.filter(isTopicId));

    /**
     * If they explicitly say "I just finished X", mark it as completed.
     *
     * This lets learners self-report progress without needing external tracking.
     */
    if (input.currentTopic && isTopicId(input.currentTopic)) {
      previous.add(input.currentTopic);
    }

    const ordered = TRACKS[track];
    const next = pickNextTopic(ordered, previous);

    /**
     * Track completed: celebrate and suggest next steps.
     */
    if (!next) {
      return {
        output: {
          message: `Nice — you’ve completed the ${track} track topics we currently have.`,
          suggestion: 'Ask for a practice project next, or switch tracks.',
        },
        checkpoints: [
          'Which of these do you feel weakest on: HTTP, APIs, SQL, or debugging?',
          'Do you want a small practice task (30–60 min) or a mini project (2–4 hrs)?',
        ],
        tutorNotes: 'We can generate a practice task next once you pick a focus area.',
      };
    }

    const node = TOPICS[next];

    /**
     * Return the next topic with:
     * - Topic metadata (id, title, description, prerequisites)
     * - Why this topic is next (prerequisite check + sequencing explanation)
     * - A simple study plan (4 steps to active learning)
     * - Checkpoints to ensure they engage before jumping to tutorials
     */
    return {
      output: {
        track,
        nextTopic: {
          id: node.id,
          title: node.title,
          description: node.description,
          prerequisites: node.prerequisites,
        },
        whyThisNext: buildWhy(node, previous),
        studyPlan: [
          'Define the concept in your own words (no googling first).',
          'Find 1 real example in a codebase or docs.',
          'Build a tiny demo (smallest possible).',
          'Write down 2 mistakes beginners make and how to avoid them.',
        ],
      },
      checkpoints: [
        `What do you already know about "${node.title}"? (2-3 sentences)`,
        `Which prerequisite feels fuzzy: ${node.prerequisites.length ? node.prerequisites.join(', ') : 'none'}?`,
        'What tiny demo could you build in 15 minutes to prove you understand it?',
      ],
      tutorNotes:
        'Don’t jump to tutorials yet—answer these checkpoints first, then I’ll give Hint 2 (a demo outline).',
    };
  },
};

/**
 * Walks the track's ordered list and finds the first uncompleted topic.
 *
 * Simple linear scan: we assume tracks are small (10–30 topics max).
 */
function pickNextTopic(ordered: TopicId[], completed: Set<TopicId>): TopicId | null {
  for (const id of ordered) {
    if (!completed.has(id)) return id;
  }
  return null;
}

/**
 * Generates a "why this topic next?" explanation.
 *
 * Checks:
 * - Are prerequisites satisfied?
 * - If missing prerequisites, warn but don't block (learners can choose to proceed)
 * - Otherwise, explain it's the next in sequence
 *
 * This keeps learners informed about the curriculum structure without being rigid.
 */
function buildWhy(node: { prerequisites: TopicId[]; tags: string[] }, completed: Set<TopicId>) {
  const missingPrereqs = node.prerequisites.filter((p) => !completed.has(p));
  if (missingPrereqs.length > 0) {
    return `You asked for this next, but you’re missing prerequisites: ${missingPrereqs.join(
      ', '
    )}. We can either backfill those or proceed carefully.`;
  }
  return 'This is the next topic in the track sequence and unlocks later concepts.';
}
