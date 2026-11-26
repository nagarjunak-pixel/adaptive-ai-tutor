export interface PedagogyGuardResult {
  passed: boolean;
  sanitizedInput: string;
  violations: string[];
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /reveal\s+(?:the\s+)?(?:answer\s+key|system\s+prompt|hidden\s+rubric)/i,
  /bypass\s+(?:socratic|pedagogical|rubric)\s+guard/i
];

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Screens learner input for prompt-injection attempts and redacts accidental PII before LLM routing.
 */
export function inspectLearnerPrompt(rawInput: string): PedagogyGuardResult {
  const sanitizedInput = rawInput.replace(EMAIL_RE, "[REDACTED_EMAIL]").trim();
  const violations: string[] = [];

  for (const rx of INJECTION_PATTERNS) {
    if (rx.test(rawInput)) {
      violations.push(`prompt_injection:${rx.source}`);
    }
  }

  return {
    passed: violations.length === 0,
    sanitizedInput,
    violations
  };
}

/**
 * Verifies that a Socratic tutor turn guides the learner via questions/scaffolds
 * instead of dumping a verbatim final answer during active problem solving.
 */
export function verifySocraticResponse(tutorReply: string, forbiddenVerbatimAnswer?: string): boolean {
  const trimmed = tutorReply.trim();
  if (!trimmed.includes("?")) {
    return false;
  }
  if (
    forbiddenVerbatimAnswer &&
    forbiddenVerbatimAnswer.trim().length > 0 &&
    trimmed.toLowerCase().includes(forbiddenVerbatimAnswer.trim().toLowerCase())
  ) {
    return false;
  }
  return true;
}
