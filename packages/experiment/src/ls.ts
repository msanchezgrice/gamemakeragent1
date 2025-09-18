import type { LsScoreInput } from '@gametok/schemas';

export type WeightMap = Record<
  LsScoreInput['scoreClass'],
  {
    play: number;
    depth: number;
    replay: number;
    save: number;
    share: number;
    type: number;
    penalty: number;
  }
>;

export const DEFAULT_WEIGHTS: WeightMap = {
  runner: { play: 0.4, depth: 0.35, replay: 0.15, save: 0.05, share: 0.05, type: 0.1, penalty: 0.1 },
  arcade: { play: 0.45, depth: 0.25, replay: 0.15, save: 0.05, share: 0.1, type: 0.05, penalty: 0.1 },
  puzzle: { play: 0.35, depth: 0.3, replay: 0.1, save: 0.2, share: 0.05, type: 0.1, penalty: 0.1 },
  skill: { play: 0.4, depth: 0.25, replay: 0.2, save: 0.05, share: 0.1, type: 0.05, penalty: 0.1 },
  strategy: { play: 0.35, depth: 0.35, replay: 0.05, save: 0.15, share: 0.1, type: 0.1, penalty: 0.1 },
  idle: { play: 0.3, depth: 0.4, replay: 0.1, save: 0.15, share: 0.05, type: 0.1, penalty: 0.1 },
  board: { play: 0.35, depth: 0.3, replay: 0.1, save: 0.2, share: 0.05, type: 0.1, penalty: 0.1 }
};

export function normalizeDepth(depthSec: number, p75ByClass: Record<string, number>, cls: LsScoreInput['scoreClass']) {
  const p75 = p75ByClass[cls] ?? 60;
  const ratio = Math.min(depthSec / p75, 1.5);
  return Math.min(ratio / 1.5, 1);
}

export function lsScore(
  input: LsScoreInput,
  p75Depth: Record<string, number>,
  weights: WeightMap = DEFAULT_WEIGHTS
) {
  const w = weights[input.scoreClass];
  const depth = normalizeDepth(input.depthSec, p75Depth, input.scoreClass);
  const raw =
    w.play * input.playRate +
    w.depth * depth +
    w.replay * input.replayRate +
    w.save * input.saveRate +
    w.share * input.shareRate +
    w.type * input.typeMetric -
    w.penalty * input.penalties;
  return clamp01(raw);
}

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
