import OpenAI from "openai";
import { computeNextReview, stepsToMastery, updateMasteryPosterior } from "@/lib/bkt";
import { CurriculumNode, selectNextZpdConcepts } from "@/lib/curriculum-dag";
import { inspectLearnerPrompt, verifySocraticResponse } from "@/lib/pedagogy-guard";
import { getAgentDescriptor, TWELVE_TUTOR_AGENTS } from "./registry";
import { AgentInvocationContext, AgentInvocationOutput, AgentRoleId } from "./types";

export const DEFAULT_CURRICULUM: CurriculumNode[] = [
  {
    id: "prob-foundations",
    title: "Conditional Probability & Bayes' Rule",
    difficulty: 1,
    estimatedMins: 25,
    prerequisites: []
  },
  {
    id: "embeddings-retrieval",
    title: "Dense Embeddings & Hybrid BM25 Retrieval",
    difficulty: 2,
    estimatedMins: 35,
    prerequisites: ["prob-foundations"]
  },
  {
    id: "rag-grounding",
    title: "Citation Grounding & Calibrated Refusal Gates",
    difficulty: 3,
    estimatedMins: 40,
    prerequisites: ["embeddings-retrieval"]
  },
  {
    id: "agentic-state-graphs",
    title: "Stateful Multi-Agent Orchestration & Checkpointing",
    difficulty: 4,
    estimatedMins: 45,
    prerequisites: ["rag-grounding"]
  }
];

async function maybeGenerateWithGpt4o(
  systemDirective: string,
  userPrompt: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-..." || process.env.NODE_ENV === "test") {
    return null;
  }
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemDirective },
      { role: "user", content: userPrompt }
    ]
  });
  return completion.choices[0]?.message?.content ?? null;
}

export async function runAgentTurn(
  agentId: AgentRoleId,
  ctx: AgentInvocationContext,
  curriculum: CurriculumNode[] = DEFAULT_CURRICULUM,
  masteryMap: Record<string, number> = {}
): Promise<AgentInvocationOutput> {
  const descriptor = getAgentDescriptor(agentId);
  const guard = inspectLearnerPrompt(ctx.learnerPrompt);

  if (agentId === "safety_pedagogy_guard") {
    return {
      agentId,
      stage: descriptor.stage,
      headline: guard.passed ? "Pedagogical & Safety Gate Passed" : "Prompt Blocked by Pedagogy Guard",
      content: guard.passed
        ? "Learner input passed PII redaction and anti-injection screening."
        : `Blocked unsafe instructional override (${guard.violations.join(", ")}).`,
      structured: { passed: guard.passed, violations: guard.violations, sanitizedInput: guard.sanitizedInput },
      guardPassed: guard.passed
    };
  }

  if (!guard.passed) {
    return {
      agentId,
      stage: descriptor.stage,
      headline: "Instructional Integrity Refusal",
      content: "Let's work through the concept step by step—what part of the problem statement feels unclear right now?",
      structured: { blockedBy: "safety_pedagogy_guard", violations: guard.violations },
      guardPassed: false
    };
  }

  switch (agentId) {
    case "curriculum_planner": {
      const unlocked = selectNextZpdConcepts(curriculum, masteryMap, 0.85);
      const nextIds = unlocked.map((c) => c.id);
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Unlocked ${unlocked.length} Zone-of-Proximal-Development Concept(s)`,
        content:
          unlocked.length > 0
            ? `Recommended next focus: ${unlocked.map((u) => u.title).join(" -> ")}.`
            : "All concepts in the active track have reached the >=0.85 mastery threshold.",
        structured: { unlockedConceptIds: nextIds, totalConcepts: curriculum.length },
        guardPassed: true
      };
    }

    case "diagnostic_placement": {
      const ordered = [...curriculum].sort((a, b) => a.difficulty - b.difficulty);
      const mid = ordered[Math.floor(ordered.length / 2)] ?? ordered[0];
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Adaptive Placement Probe: ${mid.title}`,
        content: `Diagnostic checkpoint (${mid.id}): Explain the primary invariant governing ${mid.title} and one failure mode when that invariant is violated.`,
        structured: { probeConceptId: mid.id, difficulty: mid.difficulty },
        guardPassed: true
      };
    }

    case "concept_explainer": {
      const llmText = await maybeGenerateWithGpt4o(
        descriptor.systemDirective,
        `Concept: ${ctx.conceptTitle}
Learner question: ${guard.sanitizedInput}`
      );
      const content =
        llmText ??
        `${ctx.conceptTitle}: Formal core — enforce explicit invariants over inputs and state transitions before downstream execution. Systems mental model — treat uncertainty thresholds and prerequisite contracts like typed API boundaries.`;
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Conceptual Model: ${ctx.conceptTitle}`,
        content,
        structured: { conceptId: ctx.conceptId },
        guardPassed: true
      };
    }

    case "socratic_tutor": {
      const llmText = await maybeGenerateWithGpt4o(
        descriptor.systemDirective,
        `Concept: ${ctx.conceptTitle}
Question: ${guard.sanitizedInput}`
      );
      const fallback = `Before computing the final result for ${ctx.conceptTitle}, which assumption or boundary condition in "${guard.sanitizedInput}" determines how the state updates?`;
      const candidate = llmText && verifySocraticResponse(llmText, ctx.forbiddenDirectAnswer) ? llmText : fallback;
      const socraticOk = verifySocraticResponse(candidate, ctx.forbiddenDirectAnswer);
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Socratic Coaching Turn: ${ctx.conceptTitle}`,
        content: candidate,
        structured: { socraticVerified: socraticOk },
        guardPassed: socraticOk
      };
    }

    case "worked_example": {
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Faded Worked Example: ${ctx.conceptTitle}`,
        content: `Step 1: State the known priors and constraints for ${ctx.conceptTitle}. Step 2: Apply the update invariant on an isomorphic input. Step 3 (Your turn): Complete the final verification check and explain why edge values stay bounded.`,
        structured: { fadedStepIndex: 3 },
        guardPassed: true
      };
    }

    case "code_lab_coach": {
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Code Lab Counterexample: ${ctx.conceptTitle}`,
        content: `Test your implementation of ${ctx.conceptTitle} with boundary inputs (empty set, zero-probability prior, and duplicate edges). Check whether your invariant guard throws or silently propagates NaN.`,
        structured: { suggestedEdgeCases: ["empty_input", "boundary_zero_prior", "duplicate_prerequisite"] },
        guardPassed: true
      };
    }

    case "misconception_detector": {
      const submission = (ctx.learnerSubmission ?? guard.sanitizedInput).toLowerCase();
      const expected = (ctx.expectedKeyConcepts ?? []).map((k) => k.toLowerCase());
      const missing = expected.filter((k) => !submission.includes(k));
      const tag = missing.length > 0 ? `missing_invariant:${missing[0]}` : null;
      return {
        agentId,
        stage: descriptor.stage,
        headline: tag ? `Detected Misconception (${tag})` : "No Structural Misconception Detected",
        content: tag
          ? `Submission omits key mechanism '${missing.join(", ")}'. Revisit how ${missing[0]} constrains ${ctx.conceptTitle}.`
          : `Submission aligns with expected causal mechanisms for ${ctx.conceptTitle}.`,
        structured: { misconceptionTag: tag, missingKeyConcepts: missing },
        guardPassed: true
      };
    }

    case "formative_quiz": {
      return {
        agentId,
        stage: descriptor.stage,
        headline: `Retrieval Check: ${ctx.conceptTitle}`,
        content: `Retrieval prompt: In two sentences, state when ${ctx.conceptTitle} improves reliability and identify one measurable failure signal if misconfigured.`,
        structured: { conceptId: ctx.conceptId, format: "short_constructed_response" },
        guardPassed: true
      };
    }

    case "rubric_evaluator": {
      const submission = (ctx.learnerSubmission ?? "").trim();
      const expected = ctx.expectedKeyConcepts ?? ["invariant", "verification"];
      const matched = expected.filter((kw) => submission.toLowerCase().includes(kw.toLowerCase()));
      const coverage = expected.length === 0 ? 1 : matched.length / expected.length;
      const lengthFactor = submission.length >= 40 ? 1 : 0.5;
      const score = Number((coverage * 0.8 + lengthFactor * 0.2).toFixed(4));
      const passed = score >= 0.75;
      return {
        agentId,
        stage: descriptor.stage,
        headline: passed ? `Rubric Passed (${Math.round(score * 100)}%)` : `Rubric Needs Revision (${Math.round(score * 100)}%)`,
        content: passed
          ? `Strong criterion coverage (${matched.length}/${expected.length} key concepts verified).`
          : `Covered ${matched.length}/${expected.length} rubric concepts; expand on: ${expected.filter((x) => !matched.includes(x)).join(", ")}.`,
        structured: { score, passed, matchedConcepts: matched },
        guardPassed: true
      };
    }

    case "mastery_tracker": {
      const prior = ctx.priorMastery ?? masteryMap[ctx.conceptId] ?? 0.25;
      const observedCorrect = (ctx.learnerSubmission ?? "").trim().length >= 40;
      const updated = updateMasteryPosterior(
        { pKnown: prior, pTransit: 0.18, pSlip: 0.08, pGuess: 0.2 },
        observedCorrect
      );
      const remaining = stepsToMastery(
        { pKnown: updated, pTransit: 0.18, pSlip: 0.08, pGuess: 0.2 },
        0.9
      );
      return {
        agentId,
        stage: descriptor.stage,
        headline: `BKT Mastery Updated: ${(prior * 100).toFixed(1)}% -> ${(updated * 100).toFixed(1)}%`,
        content: `Posterior mastery P(L_t) = ${updated.toFixed(3)}; estimated consecutive correct items to 90% mastery: ${remaining}.`,
        structured: { priorMastery: prior, updatedMastery: updated, remainingStepsTo90Pct: remaining },
        guardPassed: true
      };
    }

    case "spaced_repetition": {
      const prior = ctx.priorMastery ?? masteryMap[ctx.conceptId] ?? 0.5;
      const quality = Math.round(prior * 5);
      const schedule = computeNextReview({ easinessFactor: 2.5, intervalDays: 1, repetitions: 1 }, quality);
      return {
        agentId,
        stage: descriptor.stage,
        headline: `SM-2 Review Scheduled in ${schedule.intervalDays} Day(s)`,
        content: `Next retention check for ${ctx.conceptTitle} scheduled in ${schedule.intervalDays} day(s) (EF=${schedule.easinessFactor}).`,
        structured: { ...schedule, quality },
        guardPassed: true
      };
    }
  }
}

/**
 * Executes a full multi-agent learning cycle (Safety Guard -> Curriculum -> Socratic Tutor -> Rubric -> BKT -> SM-2).
 */
export async function runAdaptiveLearningCycle(ctx: AgentInvocationContext): Promise<{
  agentCount: number;
  turns: AgentInvocationOutput[];
}> {
  const sequence: AgentRoleId[] = [
    "safety_pedagogy_guard",
    "curriculum_planner",
    "socratic_tutor",
    "misconception_detector",
    "rubric_evaluator",
    "mastery_tracker",
    "spaced_repetition"
  ];
  const turns: AgentInvocationOutput[] = [];
  for (const role of sequence) {
    turns.push(await runAgentTurn(role, ctx));
  }
  return {
    agentCount: TWELVE_TUTOR_AGENTS.length,
    turns
  };
}
