export interface BktParams {
  pKnown: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
}

export interface SpacedRepetitionState {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("BKT probability parameter must be finite");
  }
  return Math.min(0.999, Math.max(0.001, value));
}

/**
 * Corbett & Anderson Bayesian Knowledge Tracing posterior update.
 * Computes P(L_t | observation) followed by learning transition P(L_{t+1}).
 */
export function updateMasteryPosterior(params: BktParams, observedCorrect: boolean): number {
  const pL = clampProbability(params.pKnown);
  const pT = clampProbability(params.pTransit);
  const pS = clampProbability(params.pSlip);
  const pG = clampProbability(params.pGuess);

  let posteriorGivenObs: number;
  if (observedCorrect) {
    const num = pL * (1 - pS);
    const den = num + (1 - pL) * pG;
    posteriorGivenObs = num / den;
  } else {
    const num = pL * pS;
    const den = num + (1 - pL) * (1 - pG);
    posteriorGivenObs = num / den;
  }

  const nextKnown = posteriorGivenObs + (1 - posteriorGivenObs) * pT;
  return Number(clampProbability(nextKnown).toFixed(6));
}

/**
 * Forecasts how many consecutive correct practice items are required to cross masteryThreshold.
 */
export function stepsToMastery(params: BktParams, masteryThreshold = 0.90, maxSteps = 25): number {
  let current = clampProbability(params.pKnown);
  if (current >= masteryThreshold) {
    return 0;
  }
  for (let step = 1; step <= maxSteps; step += 1) {
    current = updateMasteryPosterior({ ...params, pKnown: current }, true);
    if (current >= masteryThreshold) {
      return step;
    }
  }
  return maxSteps;
}

/**
 * SuperMemo-2 (SM-2) spaced repetition interval update calibrated by rubric quality (0..5).
 */
export function computeNextReview(
  state: SpacedRepetitionState,
  quality: number
): SpacedRepetitionState {
  const q = Math.min(5, Math.max(0, Math.round(quality)));
  let { easinessFactor, intervalDays, repetitions } = state;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easinessFactor));
    }
    repetitions += 1;
  }

  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  easinessFactor = Number(Math.max(1.3, easinessFactor + delta).toFixed(4));

  return { easinessFactor, intervalDays, repetitions };
}
