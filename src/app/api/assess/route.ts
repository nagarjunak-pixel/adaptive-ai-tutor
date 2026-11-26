import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAgentTurn } from "@/agents/orchestrator";

const AssessRequest = z.object({
  learnerId: z.string().min(1),
  conceptId: z.string().min(1),
  conceptTitle: z.string().min(1),
  learnerSubmission: z.string().min(1),
  expectedKeyConcepts: z.array(z.string()).default(["invariant", "verification"]),
  priorMastery: z.number().min(0).max(1).default(0.3)
});

export async function POST(req: NextRequest) {
  const payload = AssessRequest.parse(await req.json());
  const rubric = await runAgentTurn("rubric_evaluator", {
    ...payload,
    learnerPrompt: payload.learnerSubmission
  });
  const mastery = await runAgentTurn("mastery_tracker", {
    ...payload,
    learnerPrompt: payload.learnerSubmission
  });
  return NextResponse.json({ rubric, mastery });
}
