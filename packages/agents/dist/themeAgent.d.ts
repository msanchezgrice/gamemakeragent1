import type { Agent } from './base.js';
export interface ThemeAgentInput {
    theme: string;
    targetGameTypes: string[];
}
export interface ThemeAgentOutput {
    referenceId: string;
    summaryPath: string;
}
export declare const ThemeSynthesisAgent: Agent<ThemeAgentInput, ThemeAgentOutput>;
