/**
 * The analyze_assessment tool: analyzes learner answers to diagnostic questions.
 *
 * How it works:
 * 1. Learner provides a topic and their answers to diagnostic questions
 * 2. Tool analyzes each answer for knowledge gaps (terminology, conceptual, application)
 * 3. Returns detailed analysis, primary gap, and personalized recommendation
 * 4. Recommendations guide next steps: explain_concept, practice_task, or next_topic
 *
 * Design notes:
 * - Analysis is heuristic-based (keyword matching, length checks)
 * - Encourages learners to reflect on gaps and agree/disagree with analysis
 * - Recommendations are tailored to gap type for targeted learning
 *
 * To improve analysis:
 * - Add more sophisticated NLP (sentiment, coherence)
 * - Track learner progress over time
 * - Integrate with curriculum graph for better recommendations
 */
import type { MCPTool } from '../toolRegistry';
import type { MCPResponse } from '../../shared/types';
import { analyzeAnswers } from '../../tutor/diagnostics/analysis';
import { TOPICS, isTopicId } from '../../tutor/curriculum/topicGraph';

/**
 * Input contract for the analyze_assessment tool.
 *
 * - `topic`: curriculum topic that was assessed (must match assess_knowledge)
 * - `answers`: array of learner's responses to diagnostic questions
 */
interface AnalyzeAssessmentInput {
  topic: string;
  answers: string[];
}

/**
 * Exported MCPTool for analyzing learner responses to diagnostic assessments.
 *
 * Processes answers, identifies knowledge gaps, and provides tailored recommendations.
 * Helps learners understand their strengths/weaknesses and guides next learning steps.
 *
 * @param input - AnalyzeAssessmentInput (topic and answers array)
 * @param ctx - ToolContext (learner info, not used in this tool)
 * @returns MCPResponse (analysis results, summary, and recommendation)
 */
export const analyzeAssessmentTool: MCPTool<AnalyzeAssessmentInput> = {
  name: 'analyze_assessment',

  async execute(input): Promise<MCPResponse> {
    const { topic, answers } = input;

    if (!isTopicId(topic)) {
      return {
        output: {
          message: `Unknown topic "${topic}".`,
        },
        checkpoints: ['Use assess_knowledge to pick a valid topic first.'],
      };
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return {
        output: {
          message: 'No answers provided to analyze.',
        },
        checkpoints: ['Paste your answers as an array of strings.'],
      };
    }

    const analysis = analyzeAnswers(topic, answers);
    const topicNode = TOPICS[topic];

    return {
      output: {
        topic: topicNode.title,
        analysis: analysis.analyses,
        summary: analysis.summary,
        recommendation: buildRecommendation(analysis.summary.primaryGap, topic),
      },
      checkpoints: [
        'Do you agree with where the gaps are?',
        'Which question felt hardest to answer?',
      ],
      tutorNotes:
        'If this looks right, follow the recommendation. If not, tell me where it feels off.',
    };
  },
};

function buildRecommendation(gap: string, topic: string) {
  switch (gap) {
    case 'terminology':
      return {
        nextStep: 'explain_concept',
        hintLevel: 1,
        reason: 'You need clearer definitions before applying the concept.',
        payload: { concept: topic },
      };
    case 'conceptual':
      return {
        nextStep: 'explain_concept',
        hintLevel: 2,
        reason: 'You understand the words but need a clearer mental model.',
        payload: { concept: topic, hintLevel: 2 },
      };
    case 'application':
      return {
        nextStep: 'practice_task',
        reason: 'You need hands-on usage to solidify understanding.',
        suggestion: 'Ask for a small practice task next.',
      };
    default:
      return {
        nextStep: 'next_topic',
        reason: "Let's move forward and revisit this later.",
      };
  }
}
