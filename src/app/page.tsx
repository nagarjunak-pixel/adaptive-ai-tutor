import { DEFAULT_CURRICULUM } from "@/agents/orchestrator";
import { TWELVE_TUTOR_AGENTS } from "@/agents/registry";
import { selectNextZpdConcepts } from "@/lib/curriculum-dag";

export default function HomePage() {
  const sampleMastery = { "prob-foundations": 0.92, "embeddings-retrieval": 0.64 };
  const zpd = selectNextZpdConcepts(DEFAULT_CURRICULUM, sampleMastery, 0.85);

  return (
    <main>
      <h1>Adaptive AI Tutor</h1>
      <p style={{ color: "var(--muted)", maxWidth: 820 }}>
        Agentic learning platform coordinating <strong>12 specialized GPT-4o agents</strong> across
        topological curriculum planning, Socratic tutoring, misconception diagnosis, criterion-referenced
        rubric grading, Bayesian Knowledge Tracing (BKT), and SM-2 spaced repetition backed by PostgreSQL &amp; Prisma.
      </p>

      <h2>Active Zone-of-Proximal-Development Queue</h2>
      <div className="grid">
        {zpd.map((concept) => (
          <div key={concept.id} className="card">
            <span className="badge">Difficulty {concept.difficulty} · {concept.estimatedMins} min</span>
            <h3 style={{ margin: "0.2rem 0 0.4rem", fontSize: "1.05rem" }}>{concept.title}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              Prerequisites satisfied: {concept.prerequisites.join(", ") || "Foundational root"}
            </p>
          </div>
        ))}
      </div>

      <h2>12 Coordinated GPT-4o Pedagogical Agents</h2>
      <div className="grid">
        {TWELVE_TUTOR_AGENTS.map((agent, idx) => (
          <div key={agent.id} className="card">
            <span className="badge">
              #{idx + 1} · {agent.stage.toUpperCase()} · {agent.model}
            </span>
            <h3 style={{ margin: "0.2rem 0 0.4rem", fontSize: "1.02rem" }}>{agent.name}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>{agent.purpose}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
