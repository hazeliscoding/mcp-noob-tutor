/**
 * The generate_practice_task tool: provides timeboxed, guided practice tasks.
 *
 * How it works:
 * 1. Learner specifies a topic (must be in curriculum)
 * 2. Optional difficulty (easy/medium) and timebox (15/30/45/60 min)
 * 3. Tool picks a matching task from the practice bank
 * 4. Returns structured task with goal, steps, self-checks, rubric, pitfalls
 * 5. Learner completes task, then submits work for feedback
 *
 * Design notes:
 * - Tasks are curated to be "just right": not too easy, not overwhelming
 * - Timeboxing encourages focused effort without burnout
 * - Structure (steps, checks, rubric) guides without spoon-feeding
 * - Pitfalls highlight common mistakes to avoid
 *
 * To add new tasks:
 * - Add entries to src/tutor/practice/practiceBank.ts
 * - Ensure topic exists in src/tutor/curriculum/topicGraph.ts
 */
import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { isTopicId, TOPICS } from '../../tutor/curriculum/topicGraph';
import { pickPracticeTask, type PracticeDifficulty } from '../../tutor/practice/practiceBank';

/**
 * Input contract for the generate_practice_task tool.
 *
 * - `topic`: Curriculum topic to practice (required)
 * - `difficulty`: Easy or medium (defaults to easy)
 * - `timeboxMinutes`: Time limit in minutes (defaults to 30)
 */
interface GeneratePracticeTaskInput {
  topic: string;
  difficulty?: PracticeDifficulty;
  timeboxMinutes?: 15 | 30 | 45 | 60;
}

/**
 * Exported MCPTool for generating guided practice tasks.
 *
 * Selects and returns a timeboxed task based on topic, difficulty, and timebox.
 * Includes structured guidance to help learners build confidence through practice.
 *
 * @param input - GeneratePracticeTaskInput (topic, optional difficulty/timebox)
 * @param ctx - ToolContext (learner info, not used in this tool)
 * @returns MCPResponse (task details or fallback guidance)
 */
export const generatePracticeTaskTool: MCPTool<GeneratePracticeTaskInput> = {
  name: 'generate_practice_task',

  async execute(input): Promise<MCPResponse> {
    if (!isTopicId(input.topic)) {
      return {
        output: {
          message: `Unknown topic "${input.topic}".`,
          suggestion: 'Use next_topic to discover valid topic ids.',
        },
        checkpoints: ['Which topic do you want a task for? Try next_topic first.'],
      };
    }

    const difficulty = input.difficulty ?? 'easy';
    const timeboxMinutes = input.timeboxMinutes ?? 30;

    const task =
      pickPracticeTask({
        topic: input.topic,
        difficulty,
        timeboxMinutes,
      }) ??
      pickPracticeTask({
        topic: input.topic,
        difficulty,
        timeboxMinutes: 30,
      });

    const topicNode = TOPICS[input.topic];

    if (!task) {
      return {
        output: {
          topic: topicNode.title,
          message: 'No practice task found for that exact timebox/difficulty yet.',
          suggestion: 'Try difficulty=easy and timeboxMinutes=30, or ask for another topic.',
        },
        checkpoints: [
          'Do you want a smaller task (15) or a bigger one (45–60)?',
          'What stack are you practicing with (Node, .NET, frontend-only)?',
        ],
      };
    }

    return {
      output: {
        topic: topicNode.title,
        task: {
          id: task.id,
          title: task.title,
          timeboxMinutes: task.timeboxMinutes,
          difficulty: task.difficulty,
          goal: task.goal,
          constraints: task.constraints,
          steps: task.steps,
          selfChecks: task.selfChecks,
          rubric: task.rubric,
          commonPitfalls: task.commonPitfalls,
        },
        submitBack:
          'When you finish, paste: (1) what you built, (2) what broke, (3) what you learned.',
      },
      checkpoints: [
        'Before starting, restate the goal in your own words.',
        'What will you do first in the first 5 minutes?',
        'How will you verify success (one concrete check)?',
      ],
      tutorNotes:
        'Do the task inside the timebox. If you get stuck, paste your attempt and ask for Hint 2 (demo outline), not a full solution.',
    };
  },
};
