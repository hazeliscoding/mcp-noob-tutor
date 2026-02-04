import type { TopicId } from './topicGraph';

/**
 * Predefined learning tracks.
 *
 * Each track is an ordered list of topics designed to take a learner from
 * zero to capable in a specific domain.
 *
 * Tracks:
 * - `foundation`: Core web/internet concepts (no coding yet)
 * - `frontend`: HTML/CSS/JS/TS + browser APIs
 * - `backend`: APIs, databases, auth
 * - `fullstack`: A balanced mix of frontend + backend + testing
 *
 * The order matters: earlier topics are prerequisites for later ones.
 * When a learner asks for "next topic", we walk this list and pick the
 * first uncompleted topic.
 */
export const TRACKS: Record<'foundation' | 'frontend' | 'backend' | 'fullstack', TopicId[]> = {
  foundation: [
    'internet_basics',
    'http_basics',
    'dns_hosting',
    'browser_request_lifecycle',
    'git_basics',
  ],
  frontend: [
    'html_semantics',
    'css_layout',
    'js_fundamentals',
    'dom_basics',
    'fetch_ajax',
    'ts_fundamentals',
    'cors_basics',
  ],
  backend: [
    'sql_basics',
    'db_normalization',
    'transactions_acid',
    'api_rest_basics',
    'openapi_basics',
    'auth_basics',
    'indexes_query_plans',
  ],
  fullstack: [
    'internet_basics',
    'http_basics',
    'git_basics',
    'html_semantics',
    'js_fundamentals',
    'api_rest_basics',
    'fetch_ajax',
    'auth_basics',
    'sql_basics',
    'testing_basics',
    'ci_cd_basics',
    'security_basics',
  ],
};
