
/**
 * Input contract for the `explain_concept` tool.
 *
 * This tool expects a single field:
 * - `concept`: the topic the learner wants explained
 */
export interface ExplainConceptInput {
  concept: string;
}


