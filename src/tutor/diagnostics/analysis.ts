/**
 * Diagnostic analysis utilities for assessing learner knowledge gaps.
 *
 * This module analyzes learner answers to diagnostic questions and identifies
 * areas where they might need more support (terminology, concepts, application).
 *
 * How analysis works:
 * - Heuristic checks: answer length, keyword presence (define, why, use, etc.)
 * - Classifies gaps into types: terminology, conceptual, application, unknown
 * - Picks primary gap based on frequency across answers
 * - Estimates confidence based on how many answers were classifiable
 *
 * Future improvements:
 * - Integrate with LLM for more nuanced analysis
 * - Add historical tracking of learner progress
 * - Support for more gap types (e.g., debugging, design patterns)
 */
import type { TopicId } from '../curriculum/topicGraph';

/**
 * Types of knowledge gaps identified in learner answers.
 *
 * - `terminology`: Missing basic definitions or vocabulary
 * - `conceptual`: Understands words but lacks mental model or relationships
 * - `application`: Knows concepts but struggles with practical usage
 * - `unknown`: Answer too vague or short to classify
 */
export type GapType = 'terminology' | 'conceptual' | 'application' | 'unknown';

/**
 * Analysis result for a single diagnostic question.
 */
export interface AnswerAnalysis {
  questionId: number;
  gap: GapType;
  reasoning: string;
}

/**
 * Complete analysis result for an assessment.
 */
export interface AssessmentAnalysisResult {
  topic: TopicId;
  analyses: AnswerAnalysis[];
  summary: {
    primaryGap: GapType;
    confidence: 'low' | 'medium' | 'high';
  };
}

const KEYWORD_MAP: Record<GapType, string[]> = {
  terminology: ['define', 'term', 'called', 'means'],
  conceptual: ['why', 'because', 'difference', 'purpose'],
  application: ['use', 'example', 'when', 'how'],
  unknown: [],
};

/**
 * Analyzes an array of learner answers to diagnostic questions.
 *
 * For each answer, classifies the knowledge gap and provides reasoning.
 * Then summarizes across all answers to identify the primary gap and confidence level.
 *
 * @param topic - The curriculum topic being assessed
 * @param answers - Array of learner responses (one per diagnostic question)
 * @returns Detailed analysis with per-answer breakdowns and overall summary
 */
export function analyzeAnswers(topic: TopicId, answers: string[]): AssessmentAnalysisResult {
  const analyses: AnswerAnalysis[] = answers.map((a, idx) => {
    const normalized = a.toLowerCase();

    let gap: GapType = 'unknown';
    let reasoning = 'Answer was too short or vague to classify.';

    if (normalized.length < 15) {
      gap = 'terminology';
      reasoning = 'Very short answer suggests missing definitions or vocabulary.';
    } else if (containsAny(normalized, KEYWORD_MAP.application)) {
      gap = 'application';
      reasoning = 'Answer references usage or examples but may lack structure.';
    } else if (containsAny(normalized, KEYWORD_MAP.conceptual)) {
      gap = 'conceptual';
      reasoning = 'Answer discusses relationships or reasoning but may miss clarity.';
    }

    return {
      questionId: idx + 1,
      gap,
      reasoning,
    };
  });

  const primaryGap = pickPrimaryGap(analyses);
  const confidence = estimateConfidence(analyses);

  return {
    topic,
    analyses,
    summary: {
      primaryGap,
      confidence,
    },
  };
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function pickPrimaryGap(analyses: AnswerAnalysis[]): GapType {
  const counts: Record<GapType, number> = {
    terminology: 0,
    conceptual: 0,
    application: 0,
    unknown: 0,
  };

  for (const a of analyses) {
    counts[a.gap]++;
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as GapType;
}

function estimateConfidence(analyses: AnswerAnalysis[]) {
  const unknowns = analyses.filter((a) => a.gap === "unknown").length;

  if (unknowns > analyses.length / 2) return "low";
  if (unknowns > 0) return "medium";
  return "high";
}

