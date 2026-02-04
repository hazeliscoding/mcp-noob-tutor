import { MCPResponse } from '../../shared/types';
import { MCPTool } from '../toolRegistry';

/**
 * Input contract for the `explain_concept` tool.
 *
 * This tool expects a single field:
 * - `concept`: the topic the learner wants explained
 */
interface ExplainConceptInput {
  concept: string;
}

/**
 * A friendly, beginner-first tool that explains a concept and asks reflection questions.
 *
 * This is meant to be a “hello world” tool:
 * - It demonstrates input validation
 * - It varies tone slightly based on `ctx.learnerLevel`
 * - It returns checkpoints to encourage active learning
 */
export const explainConceptTool: MCPTool<ExplainConceptInput> = {
  name: 'explain_concept',

  async execute(input, ctx): Promise<MCPResponse> {
    const concept = input?.concept?.trim();

    if (!concept) {
      return {
        output: null,
        checkpoints: [],
        tutorNotes: 'Missing required field: concept',
      };
    }

    return {
      output: {
        concept,
        explanation:
          ctx.learnerLevel === 'beginner'
            ? `At a high level, "${concept}" is a core idea you’ll see often in real-world applications. Before worrying about syntax, focus on what problem it solves and where it fits in a system.`
            : `"${concept}" is a commonly used concept. Let’s make sure you understand when and why you’d use it.`,
      },
      checkpoints: [
        `In your own words, what problem does "${concept}" solve?`,
        `Where would "${concept}" appear in a real project?`,
        `What could go wrong if "${concept}" is misunderstood or misused?`,
      ],
      tutorNotes:
        'Pause here. Answer the checkpoints before asking for examples or code.',
    };
  },
};
