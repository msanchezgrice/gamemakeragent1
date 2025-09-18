import type { LsScoreInput } from '@gametok/schemas';
export type WeightMap = Record<LsScoreInput['scoreClass'], {
    play: number;
    depth: number;
    replay: number;
    save: number;
    share: number;
    type: number;
    penalty: number;
}>;
export declare const DEFAULT_WEIGHTS: WeightMap;
export declare function normalizeDepth(depthSec: number, p75ByClass: Record<string, number>, cls: LsScoreInput['scoreClass']): number;
export declare function lsScore(input: LsScoreInput, p75Depth: Record<string, number>, weights?: WeightMap): number;
