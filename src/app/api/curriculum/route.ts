import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEFAULT_CURRICULUM } from "@/agents/orchestrator";
import { buildTopologicalCurriculum, selectNextZpdConcepts } from "@/lib/curriculum-dag";

const MasteryPayload = z.object({
  masteryByConcept: z.record(z.string(), z.number().min(0).max(1)).default({})
});

export async function POST(req: NextRequest) {
  const body = MasteryPayload.parse(await req.json());
  const ordered = buildTopologicalCurriculum(DEFAULT_CURRICULUM);
  const unlocked = selectNextZpdConcepts(DEFAULT_CURRICULUM, body.masteryByConcept, 0.85);
  return NextResponse.json({ ordered, unlocked });
}
