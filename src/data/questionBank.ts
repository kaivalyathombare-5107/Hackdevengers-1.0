import type { InterviewQuestion, Difficulty } from '@/types';

export const DOMAINS = [
  'All',
  'DSA',
  'Web Dev',
  'System Design',
  'Behavioral',
  'Leadership',
  'Database',
  'Cloud & DevOps',
];

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const QUESTION_BANK: InterviewQuestion[] = [
  // Behavioral questions
  {
    id: 'b1',
    category: 'behavioral',
    domain: 'Behavioral',
    difficulty: 'easy',
    question: 'Tell me about yourself and walk me through your background.',
  },
  {
    id: 'b2',
    category: 'behavioral',
    domain: 'Behavioral',
    difficulty: 'medium',
    question: 'Describe a situation where you had a disagreement with a team member or stakeholder and how you resolved it.',
  },
  {
    id: 'b3',
    category: 'behavioral',
    domain: 'Behavioral',
    difficulty: 'medium',
    question: 'Tell me about a time you faced a tight deadline or high-pressure project. How did you prioritize your tasks?',
  },
  {
    id: 'b4',
    category: 'behavioral',
    domain: 'Leadership',
    difficulty: 'hard',
    question: 'Describe a time when a project you were leading or contributing to failed or faced major obstacles. What did you learn?',
  },
  {
    id: 'b5',
    category: 'behavioral',
    domain: 'Behavioral',
    difficulty: 'easy',
    question: 'Why are you interested in this role and what excites you about our engineering team?',
  },
  {
    id: 'b6',
    category: 'behavioral',
    domain: 'Leadership',
    difficulty: 'medium',
    question: 'Tell me about a time when you mentored a junior engineer or helped someone on your team level up their skills.',
  },

  // Technical - DSA
  {
    id: 't1',
    category: 'technical',
    domain: 'DSA',
    difficulty: 'easy',
    question: 'How would you detect a cycle in a singly linked list? What is the time and space complexity?',
  },
  {
    id: 't2',
    category: 'technical',
    domain: 'DSA',
    difficulty: 'medium',
    question: 'Explain how you would implement an LRU (Least Recently Used) cache with O(1) get and put operations.',
  },
  {
    id: 't3',
    category: 'technical',
    domain: 'DSA',
    difficulty: 'hard',
    question: 'How do you find the median of two sorted arrays in logarithmic time complexity O(log(min(N, M)))?',
  },

  // Technical - Web Dev
  {
    id: 't4',
    category: 'technical',
    domain: 'Web Dev',
    difficulty: 'easy',
    question: 'Explain the difference between client-side rendering (CSR), server-side rendering (SSR), and static site generation (SSG).',
  },
  {
    id: 't5',
    category: 'technical',
    domain: 'Web Dev',
    difficulty: 'medium',
    question: 'How does React Fiber work under the hood, and how does React manage reconciliation and virtual DOM diffing?',
  },
  {
    id: 't6',
    category: 'technical',
    domain: 'Web Dev',
    difficulty: 'medium',
    question: 'How would you optimize Core Web Vitals (LCP, FID/INP, CLS) in a heavy React web application?',
  },

  // Technical - System Design
  {
    id: 't7',
    category: 'technical',
    domain: 'System Design',
    difficulty: 'medium',
    question: 'How would you design a URL shortening service like TinyURL or bit.ly handling millions of requests per second?',
  },
  {
    id: 't8',
    category: 'technical',
    domain: 'System Design',
    difficulty: 'hard',
    question: 'Design a distributed rate limiter for a public API that supports multiple rate limiting strategies (token bucket, sliding window).',
  },

  // Technical - Database
  {
    id: 't9',
    category: 'technical',
    domain: 'Database',
    difficulty: 'medium',
    question: 'What are database indexing internals (B-Tree vs Hash index), and when might an index negatively affect performance?',
  },
  {
    id: 't10',
    category: 'technical',
    domain: 'Database',
    difficulty: 'hard',
    question: 'Explain ACID properties and the differences between transaction isolation levels (Read Committed, Repeatable Read, Serializable).',
  },

  // Technical - Cloud & DevOps
  {
    id: 't11',
    category: 'technical',
    domain: 'Cloud & DevOps',
    difficulty: 'easy',
    question: 'What is the purpose of containerization with Docker, and how does it differ from traditional virtual machines?',
  },
  {
    id: 't12',
    category: 'technical',
    domain: 'Cloud & DevOps',
    difficulty: 'medium',
    question: 'How do you design a CI/CD pipeline with zero-downtime blue/green or canary deployments?',
  },
];
