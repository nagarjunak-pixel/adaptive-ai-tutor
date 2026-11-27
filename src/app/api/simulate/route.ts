import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CURRICULUM } from "@/agents/orchestrator";
import { runHtnStudentSimulation } from "@/lib/htn-student-sim";

const SimulateRequest = z.object({
  episodeCount: z.number().int().min(1).max(100).default(25),
  masteryThreshold: z.number().min(0.5).max(0.99).default(0.85)
});

export async function POST(req: NextRequest) {
  const payload = SimulateRequest.parse(await req.json());
  const summary = runHtnStudentSimulation(
    DEFAULT_CURRICULUM,
    payload.episodeCount,
    payload.masteryThreshold
  );
  return NextResponse.json(summary);
}
