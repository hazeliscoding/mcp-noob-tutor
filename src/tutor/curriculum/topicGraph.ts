/**
 * Curriculum topic graph for the noob tutor.
 *
 * This module defines:
 * - All available learning topics (from internet basics to advanced architecture)
 * - Prerequisite relationships (so we can guide learners in a sensible order)
 * - Tags to categorize topics by domain (frontend/backend/etc.)
 *
 * Design philosophy:
 * - Topics are small and focused (1–3 hour learning chunks)
 * - Prerequisites are explicit (no hidden assumptions)
 * - Descriptions are jargon-free (learners should understand what they're about to learn)
 *
 * As the tutor grows, we can:
 * - Add difficulty levels (currently all are beginner-intermediate friendly)
 * - Track completion timestamps
 * - Generate dynamic practice problems per topic
 */

export type TopicId =
  // Foundations
  | 'internet_basics'
  | 'http_basics'
  | 'dns_hosting'
  | 'browser_request_lifecycle'
  | 'git_basics'
  // Frontend
  | 'html_semantics'
  | 'css_layout'
  | 'js_fundamentals'
  | 'dom_basics'
  | 'fetch_ajax'
  | 'ts_fundamentals'
  // Backend
  | 'api_rest_basics'
  | 'openapi_basics'
  | 'auth_basics'
  | 'sql_basics'
  | 'db_normalization'
  | 'transactions_acid'
  | 'indexes_query_plans'
  // “Real dev”
  | 'testing_basics'
  | 'ci_cd_basics'
  | 'security_basics'
  | 'cors_basics'
  | 'tls_basics'
  // Architecture (later)
  | 'caching_basics'
  | 'observability_basics'
  | 'queues_basics'
  | 'ddd_basics'
  | 'cqrs_basics';

/**
 * A single learning topic in the curriculum graph.
 *
 * Each topic has:
 * - A unique ID (used for tracking progress)
 * - A human-friendly title
 * - A short description (what you'll learn)
 * - Prerequisites (what you should know first)
 * - Tags for filtering by learning track
 */
export interface TopicNode {
  id: TopicId;
  title: string;
  description: string;
  prerequisites: TopicId[];
  tags: Array<
    'foundation' | 'frontend' | 'backend' | 'fullstack' | 'security' | 'testing' | 'architecture'
  >;
}

/**
 * The complete topic graph.
 *
 * This is the "curriculum database" — every topic the tutor can teach.
 * Topics are organized by domain but connected via prerequisites.
 *
 * When adding a new topic:
 * 1. Add its ID to the `TopicId` union type
 * 2. Create an entry here with title, description, prerequisites, tags
 * 3. Add it to the appropriate track(s) in `tracks.ts`
 */
export const TOPICS: Record<TopicId, TopicNode> = {
  internet_basics: {
    id: 'internet_basics',
    title: 'Internet Basics',
    description: 'How the internet works at a high level (clients, servers, packets, latency).',
    prerequisites: [],
    tags: ['foundation', 'fullstack'],
  },
  http_basics: {
    id: 'http_basics',
    title: 'HTTP Basics',
    description: 'Requests/responses, methods, status codes, headers, cookies.',
    prerequisites: ['internet_basics'],
    tags: ['foundation', 'fullstack'],
  },
  dns_hosting: {
    id: 'dns_hosting',
    title: 'DNS + Hosting Basics',
    description: "Domains, DNS records, where apps run, what 'hosting' really means.",
    prerequisites: ['internet_basics'],
    tags: ['foundation', 'fullstack'],
  },
  browser_request_lifecycle: {
    id: 'browser_request_lifecycle',
    title: 'Browser Request Lifecycle',
    description: 'What happens when you type a URL: DNS → TCP/TLS → HTTP → rendering.',
    prerequisites: ['http_basics', 'dns_hosting'],
    tags: ['foundation', 'frontend', 'fullstack'],
  },
  git_basics: {
    id: 'git_basics',
    title: 'Git Basics',
    description: 'Commits, branches, merges, PRs, resolving conflicts.',
    prerequisites: [],
    tags: ['foundation', 'fullstack'],
  },

  html_semantics: {
    id: 'html_semantics',
    title: 'HTML Semantics',
    description: 'Semantic tags, forms, accessibility basics.',
    prerequisites: [],
    tags: ['frontend'],
  },
  css_layout: {
    id: 'css_layout',
    title: 'CSS Layout',
    description: 'Box model, flexbox, grid, responsive design.',
    prerequisites: ['html_semantics'],
    tags: ['frontend'],
  },
  js_fundamentals: {
    id: 'js_fundamentals',
    title: 'JavaScript Fundamentals',
    description: 'Variables, functions, objects, async, promises, error handling.',
    prerequisites: ['html_semantics'],
    tags: ['frontend', 'fullstack'],
  },
  dom_basics: {
    id: 'dom_basics',
    title: 'DOM Basics',
    description: 'Selecting nodes, events, manipulating DOM safely.',
    prerequisites: ['js_fundamentals'],
    tags: ['frontend'],
  },
  fetch_ajax: {
    id: 'fetch_ajax',
    title: 'Fetch / AJAX',
    description: 'Calling APIs from the browser; JSON; basic error handling.',
    prerequisites: ['http_basics', 'js_fundamentals'],
    tags: ['frontend', 'fullstack'],
  },
  ts_fundamentals: {
    id: 'ts_fundamentals',
    title: 'TypeScript Fundamentals',
    description: 'Types, interfaces, generics, narrowing—writing safer JS.',
    prerequisites: ['js_fundamentals'],
    tags: ['frontend', 'fullstack'],
  },

  api_rest_basics: {
    id: 'api_rest_basics',
    title: 'REST API Basics',
    description: 'Resources, routes, DTOs, pagination, error contracts.',
    prerequisites: ['http_basics'],
    tags: ['backend', 'fullstack'],
  },
  openapi_basics: {
    id: 'openapi_basics',
    title: 'OpenAPI / Swagger Basics',
    description: 'Documenting APIs, schemas, and clients.',
    prerequisites: ['api_rest_basics'],
    tags: ['backend', 'fullstack'],
  },
  auth_basics: {
    id: 'auth_basics',
    title: 'Auth Basics',
    description: 'Sessions vs JWT, OAuth overview, auth vs authorization.',
    prerequisites: ['http_basics', 'api_rest_basics'],
    tags: ['backend', 'security', 'fullstack'],
  },
  sql_basics: {
    id: 'sql_basics',
    title: 'SQL Basics',
    description: 'SELECT/INSERT/UPDATE/DELETE, joins, filtering, grouping.',
    prerequisites: [],
    tags: ['backend', 'fullstack'],
  },
  db_normalization: {
    id: 'db_normalization',
    title: 'Database Normalization',
    description: '1NF/2NF/3NF thinking; preventing duplication and anomalies.',
    prerequisites: ['sql_basics'],
    tags: ['backend'],
  },
  transactions_acid: {
    id: 'transactions_acid',
    title: 'Transactions + ACID',
    description: 'Atomicity, consistency, isolation, durability; when to use transactions.',
    prerequisites: ['sql_basics'],
    tags: ['backend'],
  },
  indexes_query_plans: {
    id: 'indexes_query_plans',
    title: 'Indexes + Query Plans',
    description: 'Why indexes help, when they hurt, and reading query plans.',
    prerequisites: ['sql_basics', 'db_normalization'],
    tags: ['backend'],
  },

  testing_basics: {
    id: 'testing_basics',
    title: 'Testing Basics',
    description: 'Unit vs integration; what to test; test pyramid basics.',
    prerequisites: [],
    tags: ['testing', 'fullstack'],
  },
  ci_cd_basics: {
    id: 'ci_cd_basics',
    title: 'CI/CD Basics',
    description: 'Build pipelines, running tests automatically, deploying safely.',
    prerequisites: ['testing_basics', 'git_basics'],
    tags: ['testing', 'fullstack'],
  },
  security_basics: {
    id: 'security_basics',
    title: 'Security Basics',
    description: 'Input validation, least privilege, OWASP mindset.',
    prerequisites: ['http_basics', 'api_rest_basics'],
    tags: ['security', 'fullstack'],
  },
  cors_basics: {
    id: 'cors_basics',
    title: 'CORS Basics',
    description: 'Same-origin policy, preflight, safe browser API calls.',
    prerequisites: ['http_basics', 'fetch_ajax'],
    tags: ['security', 'frontend', 'fullstack'],
  },
  tls_basics: {
    id: 'tls_basics',
    title: 'TLS / HTTPS Basics',
    description: 'What HTTPS protects, certificates, common misconceptions.',
    prerequisites: ['http_basics', 'dns_hosting'],
    tags: ['security', 'fullstack'],
  },

  caching_basics: {
    id: 'caching_basics',
    title: 'Caching Basics',
    description: 'Why caching exists, cache invalidation, HTTP vs server caches.',
    prerequisites: ['http_basics', 'api_rest_basics'],
    tags: ['architecture', 'fullstack'],
  },
  observability_basics: {
    id: 'observability_basics',
    title: 'Observability Basics',
    description: 'Logs, metrics, traces; how to debug systems in production.',
    prerequisites: ['api_rest_basics'],
    tags: ['architecture', 'fullstack'],
  },
  queues_basics: {
    id: 'queues_basics',
    title: 'Queues Basics',
    description: 'Async processing, retries, DLQs, eventual consistency.',
    prerequisites: ['api_rest_basics'],
    tags: ['architecture', 'backend'],
  },
  ddd_basics: {
    id: 'ddd_basics',
    title: 'DDD Basics',
    description: 'Bounded contexts, aggregates, ubiquitous language.',
    prerequisites: ['api_rest_basics', 'sql_basics'],
    tags: ['architecture', 'backend'],
  },
  cqrs_basics: {
    id: 'cqrs_basics',
    title: 'CQRS Basics',
    description: 'Separating reads/writes, when it helps, when it’s overkill.',
    prerequisites: ['ddd_basics'],
    tags: ['architecture', 'backend'],
  },
};

/**
 * Type guard to check if a string is a valid TopicId.
 *
 * Useful when parsing user input or previous topics from context.
 */
export function isTopicId(value: string): value is TopicId {
  return Object.prototype.hasOwnProperty.call(TOPICS, value);
}
