import { describe, expect, it } from "vitest";
import { DEFAULT_CURRICULUM } from "@/agents/orchestrator";
import { runHtnStudentSimulation } from "@/lib/htn-student-sim";

describe("HTN Multi-Step Learner Simulator (ReUST Verification)", () => {
  it("completes 25 multi-turn episodes with zero Socratic answer leaks, blocks adversarial shortcuts, and converges BKT mastery >= 0.85", () => {
    const summary = runHtnStudentSimulation(DEFAULT_CURRICULUM, 25, 0.85);
    expect(summary.episodesRun).toBe(25);
    expect(summary.socraticLeakCount).toBe(0);
    expect(summary.injectionBlockedCount).toBe(5);
    expect(summary.convergedConcepts.length).toBeGreaterThanOrEqual(3);
    expect(summary.finalMasteryByConcept["prob-foundations"]).toBeGreaterThanOrEqual(0.85);
  });
});
