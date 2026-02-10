import type { MCPTool } from "../toolRegistry";
import type { MCPResponse } from "../../shared/types";
import { DIAGNOSTICS } from "../../tutor/diagnostics/diagnostics";
import { TOPICS, isTopicId } from "../../tutor/curriculum/topicGraph";

interface AssessKnowledgeInput {
  topic: string;
}

export const assessKnowledgeTool: MCPTool<AssessKnowledgeInput> = {
  name: "assess_knowledge",

  async execute(input, ctx): Promise<MCPResponse> {
    const rawTopic = input.topic;

    if (!isTopicId(rawTopic)) {
      return {
        output: {
          message: `I don't recognize "${rawTopic}" as a curriculum topic.`,
          suggestion: "Ask for next_topic to see valid topics.",
        },
        checkpoints: [
          "Which topic are you trying to assess?",
          "Is this frontend, backend, or fullstack?",
        ],
        tutorNotes:
          "Use next_topic if you're unsure what to study next.",
      };
    }

    const diagnostic = DIAGNOSTICS[rawTopic];
    const topicNode = TOPICS[rawTopic];

    if (!diagnostic) {
      return {
        output: {
          topic: topicNode.title,
          message:
            "I don’t have diagnostic questions for this topic yet.",
          suggestion:
            "We can still proceed by explaining the concept or doing a practice task.",
        },
        checkpoints: [
          `What do you already know about "${topicNode.title}"?`,
          "What feels confusing or unclear?",
        ],
        tutorNotes:
          "Answer these and I’ll tailor the next step.",
      };
    }

    return {
      output: {
        topic: topicNode.title,
        description: topicNode.description,
        instructions:
          "Answer these questions honestly without looking anything up. This is about finding gaps, not passing.",
        questions: diagnostic.questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
        })),
        howToAnswer:
          "Short bullet points or 1–2 sentences per question is enough.",
      },
      checkpoints: [
        "Answer all questions before asking for feedback.",
        "Mark any question you feel unsure about.",
      ],
      tutorNotes:
        "After you answer, paste your responses and I’ll analyze gaps and recommend the next topic or practice task.",
    };
  },
};
