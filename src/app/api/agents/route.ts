import { NextResponse } from "next/server";
import { TWELVE_TUTOR_AGENTS } from "@/agents/registry";

export async function GET() {
  return NextResponse.json({
    count: TWELVE_TUTOR_AGENTS.length,
    agents: TWELVE_TUTOR_AGENTS
  });
}
