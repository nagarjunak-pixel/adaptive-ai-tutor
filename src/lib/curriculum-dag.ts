export interface CurriculumNode {
  id: string;
  title: string;
  difficulty: number;
  estimatedMins: number;
  prerequisites: string[];
}

/**
 * Deterministic Kahn topological sort ordered by difficulty then concept ID.
 * Throws if the prerequisite graph contains a cycle or an unknown prerequisite.
 */
export function buildTopologicalCurriculum(nodes: CurriculumNode[]): CurriculumNode[] {
  const nodeMap = new Map<string, CurriculumNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    dependents.set(n.id, []);
  }

  for (const n of nodes) {
    for (const pre of n.prerequisites) {
      if (!nodeMap.has(pre)) {
        throw new Error(`Unknown prerequisite '${pre}' referenced by '${n.id}'`);
      }
      inDegree.set(n.id, (inDegree.get(n.id) ?? 0) + 1);
      dependents.get(pre)!.push(n.id);
    }
  }

  const ready: CurriculumNode[] = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));

  const ordered: CurriculumNode[] = [];
  while (ready.length > 0) {
    const current = ready.shift()!;
    ordered.push(current);

    for (const depId of dependents.get(current.id) ?? []) {
      const nextDeg = (inDegree.get(depId) ?? 0) - 1;
      inDegree.set(depId, nextDeg);
      if (nextDeg === 0) {
        ready.push(nodeMap.get(depId)!);
        ready.sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
      }
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Cycle detected in curriculum prerequisite graph");
  }

  return ordered;
}

/**
 * Returns Zone-of-Proximal-Development concepts: unmastered concepts whose prerequisites
 * meet or exceed masteryThreshold.
 */
export function selectNextZpdConcepts(
  nodes: CurriculumNode[],
  masteryByConcept: Record<string, number>,
  masteryThreshold = 0.85
): CurriculumNode[] {
  const ordered = buildTopologicalCurriculum(nodes);
  return ordered.filter((node) => {
    const selfMastery = masteryByConcept[node.id] ?? 0;
    if (selfMastery >= masteryThreshold) {
      return false;
    }
    return node.prerequisites.every((pre) => (masteryByConcept[pre] ?? 0) >= masteryThreshold);
  });
}
