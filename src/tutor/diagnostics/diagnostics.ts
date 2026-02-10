import type { TopicId } from '../curriculum/topicGraph';

export interface DiagnosticQuestion {
  question: string;
  whatItTests: string;
}

export interface DiagnosticSet {
  topic: TopicId;
  questions: DiagnosticQuestion[];
}

export const DIAGNOSTICS: Record<TopicId, DiagnosticSet> = {
  http_basics: {
    topic: 'http_basics',
    questions: [
      {
        question: 'What is the difference between GET and POST?',
        whatItTests: 'Understanding of HTTP methods and intent',
      },
      {
        question: 'What does a 404 status code mean?',
        whatItTests: 'Status code literacy',
      },
      {
        question: 'Where do headers fit into an HTTP request?',
        whatItTests: 'Request structure comprehension',
      },
    ],
  },

  api_rest_basics: {
    topic: 'api_rest_basics',
    questions: [
      {
        question: 'What is a resource in REST?',
        whatItTests: 'REST mental model',
      },
      {
        question: 'When would you use PATCH instead of PUT?',
        whatItTests: 'Update semantics',
      },
    ],
  },

  sql_basics: {
    topic: 'sql_basics',
    questions: [
      {
        question: 'What does a JOIN do in SQL?',
        whatItTests: 'Relational thinking',
      },
      {
        question: 'What happens if you run UPDATE without a WHERE clause?',
        whatItTests: 'Data safety awareness',
      },
    ],
  },

  cors_basics: {
    topic: 'cors_basics',
    questions: [
      {
        question: 'Who enforces CORS: the browser or the server?',
        whatItTests: 'Security model understanding',
      },
      {
        question: 'Why can Postman call an API even when the browser cannot?',
        whatItTests: 'CORS scope comprehension',
      },
    ],
  },

  auth_basics: {
    topic: 'auth_basics',
    questions: [
      {
        question: 'What is the difference between authentication and authorization?',
        whatItTests: 'Auth vocabulary',
      },
      {
        question: 'What problem does a JWT solve?',
        whatItTests: 'Stateless auth understanding',
      },
    ],
  },
};
