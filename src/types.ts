export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  link: string;
  description: string;
  tech: string;
};

export type SkillItem = {
  id: string;
  name: string;
};

export type ResumeTemplate = 'modern' | 'classic' | 'minimal' | 'creative';

export type ResumeData = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  image?: string;
  template: ResumeTemplate;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
};

export const emptyResume: ResumeData = {
  fullName: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  summary: '',
  image: '',
  template: 'modern',
  education: [],
  experience: [],
  skills: [],
  projects: [],
};

export type StepKey = 'personal' | 'education' | 'experience' | 'skills' | 'projects' | 'template';

export const STEPS: { key: StepKey; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal Info', icon: 'User' },
  { key: 'education', label: 'Education', icon: 'GraduationCap' },
  { key: 'experience', label: 'Experience', icon: 'Briefcase' },
  { key: 'skills', label: 'Skills', icon: 'Sparkles' },
  { key: 'projects', label: 'Projects', icon: 'FolderGit2' },
  { key: 'template', label: 'Template', icon: 'LayoutTemplate' },
];

export const genId = () => Math.random().toString(36).slice(2, 10);

// ── Interview Coach ─────────────────────────────────────────────────────────

export type QuestionCategory = 'behavioral' | 'technical';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type InterviewQuestion = {
  id: string;
  category: QuestionCategory;
  domain?: string; // e.g. 'DSA', 'Web Dev', 'System Design'
  difficulty: Difficulty;
  question: string;
};

export type AnswerEvaluation = {
  clarityScore: number;       // 1–10
  relevanceScore: number;     // 1–10
  structureScore: number;     // 1–10 (STAR format)
  confidenceScore: number;    // 1–10
  overallScore: number;       // 1–10
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
};

export type InterviewSession = {
  id: string;
  date: string;              // ISO string
  questions: InterviewQuestion[];
  answers: Record<string, string>;       // questionId → answer text
  evaluations: Record<string, AnswerEvaluation>; // questionId → evaluation
  averageScore: number;
  jdUsed?: string;
};

// ── Saved Resume Versions ───────────────────────────────────────────────────

export type SavedResume = {
  id: string;
  name: string;
  data: ResumeData;
  createdAt: string;
  updatedAt: string;
};

// ── Progress Tracking ───────────────────────────────────────────────────────

export type ProgressEntry = {
  id: string;
  date: string;
  resumeScore: number | null;
  jdMatchScore: number | null;
  interviewAvgScore: number | null;
  sessionsCompleted: number;
};
