import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAdaptiveLearningCycle } from "@/agents/orchestrator";

const TutorRequest = z.object({
  learnerId: z.string().min(1),
  conceptId: z.string().min(1),
  conceptTitle: z.string().min(1),
  learnerPrompt: z.string().min(1),
  learnerSubmission: z.string().optional(),
  expectedKeyConcepts: z.array(z.string()).optional(),
  priorMastery: z.number().min(0).max(1).optional()
});

export async function POST(req: NextRequest) {
  const payload = TutorRequest.parse(await req.json());
  const result = await runAdaptiveLearningCycle(payload);
  return NextResponse.json(result);
}
