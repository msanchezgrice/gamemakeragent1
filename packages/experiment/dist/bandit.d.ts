export interface Arm {
    id: string;
    success: number;
    trials: number;
    minImpressions: number;
}
export declare function thompsonSample(arms: Arm[], rng?: () => number): string | undefined;
