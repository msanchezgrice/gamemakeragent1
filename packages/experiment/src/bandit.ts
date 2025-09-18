export interface Arm {
  id: string;
  success: number;
  trials: number;
  minImpressions: number;
}

export function thompsonSample(arms: Arm[], rng: () => number = Math.random): string | undefined {
  if (!arms.length) return undefined;
  const samples = arms.map((arm) => ({
    arm,
    value: betaSample(1 + arm.success, 1 + Math.max(arm.trials - arm.success, 0), rng)
  }));
  samples.sort((a, b) => b.value - a.value);
  return samples[0]?.arm.id;
}

function betaSample(alpha: number, beta: number, rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  const x = -Math.log(1 - u1) / alpha;
  const y = -Math.log(1 - u2) / beta;
  return x / (x + y);
}
