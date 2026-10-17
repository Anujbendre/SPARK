export type ContributorSummary = {
  login: string;
  contributions: number;
  avatar_url: string;
  html_url?: string | null;
};

export type ArchitectureModule = {
  id: string;
  name: string;
  path: string;
  description: string;
  scope: string;
  files: string[];
  reviewers: string[];
};

export type IssueSummary = {
  number: number;
  title: string;
  html_url: string;
  labels: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  rationale: string;
  touch_files: string[];
  steps: string[];
};

export type ContributionStep = {
  step_number: string;
  title: string;
  description: string;
  status: string;
  badge: string;
};

export type RepositoryAnalysis = {
  full_name: string;
  description: string | null;
  default_branch: string;
  stars: number;
  forks: number;
  language: string | null;
  open_issues: number;
  license_name: string | null;
  topics: string[];
  contributors: ContributorSummary[];
  issues: IssueSummary[];
  top_level_paths: string[];
  ai_summary: string | null;
  primary_dependency: string | null;
  architecture_pattern: string | null;
  recommended_entrypoint: string | null;
  modules: ArchitectureModule[];
  roadmap: ContributionStep[];
  mermaid_diagram?: string | null;
};

export type Citation = {
  file: string;
  snippet: string;
};

export type AskResponse = {
  answer: string;
  citations: Citation[];
};
