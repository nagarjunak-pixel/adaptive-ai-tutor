export type AgentRoleId =
  | "curriculum_planner"
  | "diagnostic_placement"
  | "concept_explainer"
  | "socratic_tutor"
  | "worked_example"
  | "code_lab_coach"
  | "misconception_detector"
  | "formative_quiz"
  | "rubric_evaluator"
  | "mastery_tracker"
  | "spaced_repetition"
  | "safety_pedagogy_guard";

export interface AgentDescriptor {
  id: AgentRoleId;
  name: string;
  stage: "curriculum" | "tutoring" | "assessment" | "governance";
  model: string;
  purpose: string;
  systemDirective: string;
}

export interface AgentInvocationContext {
  learnerId: string;
  conceptId: string;
  conceptTitle: string;
  learnerPrompt: string;
  learnerSubmission?: string;
  expectedKeyConcepts?: string[];
  forbiddenDirectAnswer?: string;
  priorMastery?: number;
}

export interface AgentInvocationOutput {
  agentId: AgentRoleId;
  stage: AgentDescriptor["stage"];
  headline: string;
  content: string;
  structured: Record<string, unknown>;
  guardPassed: boolean;
}
