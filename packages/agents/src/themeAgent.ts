import { createAgentLogger } from './base.js';
import type { Agent, AgentContext } from './base.js';

export interface ThemeAgentInput {
  theme: string;
  targetGameTypes: string[];
}

export interface ThemeAgentOutput {
  referenceId: string;
  summaryPath: string;
}

export const ThemeSynthesisAgent: Agent<ThemeAgentInput, ThemeAgentOutput> = {
  name: 'ThemeSynthesisAgent',
  async run(input, ctx) {
    const logger = createAgentLogger({ scope: `${this.name}:${ctx.runId}` });
    logger.info('Synthesizing theme insights', { theme: input.theme });
    const summary = buildSummaryMarkdown(input, ctx);
    const artifact = await ctx.saveArtifact({
      kind: 'market_theme_summary',
      extension: 'md',
      data: summary,
      meta: {
        theme: input.theme,
        targetGameTypes: input.targetGameTypes
      }
    });
    return {
      referenceId: artifact.sha256 ?? artifact.path,
      summaryPath: artifact.path
    };
  }
};

function buildSummaryMarkdown(input: ThemeAgentInput, ctx: AgentContext) {
  const date = ctx.clock().toISOString();
  return `# Theme Brief: ${input.theme}\n\nGenerated: ${date}\nRun: ${ctx.runId}\n\n## Recommended Game Types\n${input.targetGameTypes
    .map((type) => `- ${type}`)
    .join('\n')}\n\n## Starter Hooks\n- Hook your audience within 3 seconds with contrasting colors.\n- Showcase core loop footage immediately.\n- Reinforce educational payoff using tight copy.\n`;
}
