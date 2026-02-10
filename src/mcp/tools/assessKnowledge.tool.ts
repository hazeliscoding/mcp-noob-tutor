/**
 * The assess_knowledge tool: quick diagnostic questions for curriculum topics.
 *
 * How it works:
 * 1. Learner specifies a topic (must be a valid curriculum topic)
 * 2. If topic is recognized, returns diagnostic questions for self-assessment
 * 3. If topic is unknown or lacks diagnostics, provides guidance and checkpoints
 * 4. After answering, learners paste responses for gap analysis and next steps
 *
 * Design notes:
 * - Diagnostics are short, focused, and beginner-friendly
 * - Tool encourages honest self-assessment, not passing/failing
 * - If diagnostics are missing, fallback prompts keep the learning loop active
 *
 * To add new diagnostics:
 * - Add questions to src/tutor/diagnostics/diagnostics.ts
 * - Ensure topic exists in src/tutor/curriculum/topicGraph.ts
 */
import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { DIAGNOSTICS } from '../../tutor/diagnostics/diagnostics';
import { TOPICS, isTopicId } from '../../tutor/curriculum/topicGraph';

/**
 * Input contract for the assess_knowledge tool.
 *
 * - `topic`: curriculum topic to assess (required)
 */
interface AssessKnowledgeInput {
  topic: string;
}

/**
 * Exported MCPTool for assessing knowledge on a curriculum topic.
 *
 * Returns diagnostic questions, fallback guidance, and checkpoints for self-assessment.
 * Encourages honest answers and gap analysis before recommending next steps.
 *
 * @param input - AssessKnowledgeInput (topic to assess)
 * @param ctx - ToolContext (learner info)
 * @returns MCPResponse (diagnostic questions or fallback guidance)
 */
export const assessKnowledgeTool: MCPTool<AssessKnowledgeInput> = {
  name: 'assess_knowledge',

  async execute(input, ctx): Promise<MCPResponse> {
    const rawTopic = input.topic;

    // Validate topic: must be a known curriculum topic
    if (!isTopicId(rawTopic)) {
      return {
        output: {
          message: `I don't recognize "${rawTopic}" as a curriculum topic.`,
          suggestion: 'Ask for next_topic to see valid topics.',
        },
        checkpoints: [
          'Which topic are you trying to assess?',
          'Is this frontend, backend, or fullstack?',
        ],
        tutorNotes: "Use next_topic if you're unsure what to study next.",
      };
    }

    const diagnostic = DIAGNOSTICS[rawTopic];
    const topicNode = TOPICS[rawTopic];

    // If no diagnostics exist, provide fallback guidance
    if (!diagnostic) {
      return {
        output: {
          topic: topicNode.title,
          message: 'I don’t have diagnostic questions for this topic yet.',
          suggestion: 'We can still proceed by explaining the concept or doing a practice task.',
        },
        checkpoints: [
          `What do you already know about "${topicNode.title}"?`,
          'What feels confusing or unclear?',
        ],
        tutorNotes: 'Answer these and I’ll tailor the next step.',
      };
    }

    // Return diagnostic questions for self-assessment
    return {
      output: {
        topic: topicNode.title,
        description: topicNode.description,
        instructions:
          'Answer these questions honestly without looking anything up. This is about finding gaps, not passing.',
        questions: diagnostic.questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
        })),
        howToAnswer: 'Short bullet points or 1–2 sentences per question is enough.',
      },
      checkpoints: [
        'Answer all questions before asking for feedback.',
        'Mark any question you feel unsure about.',
      ],
      tutorNotes:
        'After you answer, paste your responses and I’ll analyze gaps and recommend the next topic or practice task.',
    };
  },
};
