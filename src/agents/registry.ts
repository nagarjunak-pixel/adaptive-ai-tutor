import { AgentDescriptor, AgentRoleId } from "./types";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

export const TWELVE_TUTOR_AGENTS: readonly AgentDescriptor[] = [
  {
    id: "curriculum_planner",
    name: "Curriculum Planner Agent",
    stage: "curriculum",
    model: DEFAULT_MODEL,
    purpose: "Sequences prerequisite DAG nodes into an individualized Zone-of-Proximal-Development study path.",
    systemDirective: "Produce a topologically valid prerequisite study plan prioritized by learner readiness."
  },
  {
    id: "diagnostic_placement",
    name: "Diagnostic Placement Agent",
    stage: "curriculum",
    model: DEFAULT_MODEL,
    purpose: "Runs adaptive binary-search placement probes to initialize per-concept mastery priors.",
    systemDirective: "Select high-information diagnostic probes that separate foundational gaps from careless slips."
  },
  {
    id: "concept_explainer",
    name: "Concept Explainer Agent",
    stage: "tutoring",
    model: DEFAULT_MODEL,
    purpose: "Builds dual- representation explanations combining formal invariants and concrete systems analogies.",
    systemDirective: "Explain the target concept clearly using formal definition, mental model, and boundary conditions."
  },
  {
    id: "socratic_tutor",
    name: "Socratic Tutor Agent",
    stage: "tutoring",
    model: DEFAULT_MODEL,
    purpose: "Guides problem solving through targeted hints and probing questions without premature answer dumping.",
    systemDirective: "Never give the final answer directly; ask a focused guiding question anchored in the learner's state."
  },
  {
    id: "worked_example",
    name: "Worked Example Scaffolder Agent",
    stage: "tutoring",
    model: DEFAULT_MODEL,
    purpose: "Generates isomorphic worked examples with faded intermediate steps to reduce cognitive overload.",
    systemDirective: "Demonstrate an isomorphic problem step-by-step and leave the final transfer step for the learner."
  },
  {
    id: "code_lab_coach",
    name: "Code Lab Coach Agent",
    stage: "tutoring",
    model: DEFAULT_MODEL,
    purpose: "Designs hands-on coding exercises and minimal failing counterexamples for debugging practice.",
    systemDirective: "Provide a minimal reproducible edge case and coaching hint rather than rewriting the learner's code."
  },
  {
    id: "misconception_detector",
    name: "Misconception Detector Agent",
    stage: "assessment",
    model: DEFAULT_MODEL,
    purpose: "Classifies systematic conceptual errors versus syntax or arithmetic slips from learner responses.",
    systemDirective: "Map incorrect reasoning to an explicit misconception tag and targeted remediation hook."
  },
  {
    id: "formative_quiz",
    name: "Formative Retrieval Quiz Agent",
    stage: "assessment",
    model: DEFAULT_MODEL,
    purpose: "Synthesizes difficulty-calibrated retrieval questions with misconception-aligned distractors.",
    systemDirective: "Generate retrieval practice items targeting active recall and boundary-condition reasoning."
  },
  {
    id: "rubric_evaluator",
    name: "Criterion Rubric Evaluator Agent",
    stage: "assessment",
    model: DEFAULT_MODEL,
    purpose: "Scores open-ended explanations and code solutions against explicit multi-criterion rubrics.",
    systemDirective: "Grade strictly against the rubric criteria with evidence quotes and actionable improvement steps."
  },
  {
    id: "mastery_tracker",
    name: "Bayesian Mastery Tracker Agent",
    stage: "assessment",
    model: DEFAULT_MODEL,
    purpose: "Updates Bayesian Knowledge Tracing posteriors and forecasts remaining practice steps to mastery.",
    systemDirective: "Compute updated mastery probability P(L_t) and readiness for downstream dependent concepts."
  },
  {
    id: "spaced_repetition",
    name: "Spaced Repetition Scheduler Agent",
    stage: "curriculum",
    model: DEFAULT_MODEL,
    purpose: "Schedules retention reviews using SM-2 easiness dynamics and forgetting-curve priority.",
    systemDirective: "Calculate optimal review intervals so mastered concepts are reinforced before decay."
  },
  {
    id: "safety_pedagogy_guard",
    name: "Safety & Pedagogy Guard Agent",
    stage: "governance",
    model: DEFAULT_MODEL,
    purpose: "Blocks prompt injection, redacts PII, and enforces anti-answer-dumping Socratic constraints.",
    systemDirective: "Enforce strict pedagogical integrity, PII redaction, and safe instructional responses."
  }
] as const;

export function getAgentDescriptor(agentId: AgentRoleId): AgentDescriptor {
  const found = TWELVE_TUTOR_AGENTS.find((a) => a.id === agentId);
  if (!found) {
    throw new Error(`Unknown tutor agent role: ${agentId}`);
  }
  return found;
}
