import type { TopicId } from '../curriculum/topicGraph';

export interface DiagnosticQuestion {
  question: string;
  whatItTests: string;
}

export interface DiagnosticSet {
  topic: TopicId;
  questions: DiagnosticQuestion[];
}

/**
 * Diagnostic sets keyed by TopicId.
 *
 * Sparse by design: not every topic has diagnostics yet. Consumers (like the
 * `assess_knowledge` tool) handle the missing-topic case by returning a
 * fallback response.
 */
export const DIAGNOSTICS: Partial<Record<TopicId, DiagnosticSet>> = {
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

  js_fundamentals: {
    topic: 'js_fundamentals',
    questions: [
      {
        question:
          'What is the difference between == and === in JavaScript, and which should you usually prefer?',
        whatItTests: 'Type coercion awareness',
      },
      {
        question: 'What does `await` do when you use it inside an async function?',
        whatItTests: 'Async mental model',
      },
      {
        question:
          'Why does `const arr = [1,2,3]; arr.push(4)` not cause a "cannot assign to const" error?',
        whatItTests: 'Reference vs value semantics',
      },
    ],
  },

  git_basics: {
    topic: 'git_basics',
    questions: [
      {
        question: 'What is the difference between git fetch and git pull?',
        whatItTests: 'Remote vs local state distinction',
      },
      {
        question: 'Why is force-pushing to a shared branch dangerous?',
        whatItTests: 'History-mutation awareness',
      },
      {
        question: 'What does a merge commit represent that a fast-forward merge does not?',
        whatItTests: 'Branching model understanding',
      },
    ],
  },

  testing_basics: {
    topic: 'testing_basics',
    questions: [
      {
        question: 'Describe the test pyramid. Which layer should have the most tests, and why?',
        whatItTests: 'Test strategy literacy',
      },
      {
        question: 'What is the difference between a unit test and an integration test?',
        whatItTests: 'Scope vocabulary',
      },
    ],
  },

  security_basics: {
    topic: 'security_basics',
    questions: [
      {
        question: 'Name one input you must validate on the server even if the client already did.',
        whatItTests: 'Trust boundary understanding',
      },
      {
        question:
          'What does "least privilege" mean, and how would you apply it to a service account?',
        whatItTests: 'Security mindset',
      },
    ],
  },

  fetch_ajax: {
    topic: 'fetch_ajax',
    questions: [
      {
        question: 'When a fetch() returns, is it already resolved with the JSON body?',
        whatItTests: 'Promise + stream model',
      },
      {
        question: 'If a server returns 500, does fetch() reject or resolve? Why?',
        whatItTests: 'Error-handling contract',
      },
      {
        question: 'What header tells the server you are sending JSON, and why does it matter?',
        whatItTests: 'Content-Type literacy',
      },
    ],
  },
};
