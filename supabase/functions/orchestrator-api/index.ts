import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Artifact generation functions
async function generatePhaseArtifacts(supabaseClient: any, runId: string, phase: string, brief: any) {
  console.log(`🎨 Generating artifacts for ${phase} phase of run ${runId}`)
  
  try {
    switch (phase) {
      case 'intake':
        await generateIntakeArtifacts(supabaseClient, runId, brief);
        break;
      case 'market':
        await generateMarketArtifacts(supabaseClient, runId, brief);
        break;
      case 'synthesis':
        await generateSynthesisArtifacts(supabaseClient, runId, brief);
        break;
      case 'deconstruct':
        await generateDeconstructArtifacts(supabaseClient, runId, brief);
        break;
      case 'prioritize':
        await generatePrioritizeArtifacts(supabaseClient, runId, brief);
        break;
      case 'build':
        await generateBuildArtifacts(supabaseClient, runId, brief);
        break;
      case 'qa':
        await generateQAArtifacts(supabaseClient, runId, brief);
        break;
      case 'deploy':
        await generateDeployArtifacts(supabaseClient, runId, brief);
        break;
      case 'measure':
        await generateMeasureArtifacts(supabaseClient, runId, brief);
        break;
      case 'decision':
        await generateDecisionArtifacts(supabaseClient, runId, brief);
        break;
    }
  } catch (error) {
    console.error(`❌ Failed to generate artifacts for ${phase}:`, error);
  }
}

async function generateMarketArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🔍 Generating real market research for ${brief.theme} in ${brief.industry}`);
  
  // Real LLM call to Claude for market research
  const marketPrompt = `You are a market research analyst for mobile games. Analyze the market for a ${brief.theme} themed game in the ${brief.industry} industry targeting ${brief.targetAudience || 'general audience'}.

Goal: ${brief.goal}

Provide a comprehensive market analysis in JSON format with:
1. Current market trends (array of strings)
2. Top 5 competing games (with names and brief descriptions)
3. Market insights and opportunities
4. Competitor analysis with gaps identified
5. Recommended features for this specific theme/industry combo
6. Estimated market size and confidence level

Return ONLY valid JSON with this structure:
{
  "trends": ["trend1", "trend2", ...],
  "topGames": [{"name": "Game Name", "description": "Brief desc"}, ...],
  "insights": "Detailed market insights...",
  "competitorAnalysis": {
    "directCompetitors": number,
    "marketGap": "Description of opportunity",
    "recommendedFeatures": ["feature1", "feature2", ...]
  },
  "marketSize": "X million downloads/month",
  "confidence": 0.0-1.0,
  "reasoning": "Why this analysis is relevant..."
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log(`🔑 API Key status: ${apiKey ? 'Present' : 'Missing'}, Length: ${apiKey?.length || 0}`);
    
    // Make actual LLM API call (using fetch to Claude API)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: marketPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const marketDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const marketData = JSON.parse(marketDataText);
    
    console.log(`✅ Generated real market data:`, marketData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'market',
        agent: 'market-research-agent',
        level: 'info',
        message: `Market research completed for ${brief.theme}`,
        thinking_trace: marketPrompt,
        llm_response: marketDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'market',
        kind: 'market_scan',
        path: `runs/${runId}/market_scan.json`,
        meta: {
          filename: 'market_scan.json',
          size: JSON.stringify(marketData).length,
          contentType: 'application/json',
          data: marketData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for market research:`, error);
    
    // Store error in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'market',
        agent: 'market-research-agent',
        level: 'error',
        message: `Market research failed: ${error.message}`,
        thinking_trace: marketPrompt,
        llm_response: null,
        created_at: new Date().toISOString()
      });
    
    // Fallback to structured placeholder if LLM fails
    const fallbackData = {
      trends: ['hypercasual', 'educational', brief.industry.toLowerCase()],
      topGames: [
        {name: 'Market Leader 1', description: `Top ${brief.industry} game with ${brief.theme} elements`},
        {name: 'Market Leader 2', description: `Popular ${brief.targetAudience} focused game`}
      ],
      insights: `Market analysis for ${brief.theme} in ${brief.industry}. LLM analysis failed, using structured fallback.`,
      competitorAnalysis: {
        directCompetitors: 2,
        marketGap: `Opportunity in ${brief.theme} + ${brief.industry} combination`,
        recommendedFeatures: ['Engaging mechanics', 'Clear progression', 'Social features']
      },
      marketSize: '15-25 million downloads/month',
      confidence: 0.6,
      reasoning: 'Fallback analysis due to LLM API failure'
    };

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'market',
        kind: 'market_scan',
        path: `runs/${runId}/market_scan.json`,
        meta: {
          filename: 'market_scan.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateSynthesisArtifacts(supabaseClient: any, runId: string, brief: any) {
  const synthesisContent = `# Theme Analysis: ${brief.theme}

## Key Insights

- **Visual Style**: Modern, ${brief.industry === 'education' ? 'educational' : 'engaging'} design
- **Core Mechanics**: ${brief.theme.includes('space') ? 'Physics-based movement' : 'Simple tap/swipe interactions'}
- **Target Audience**: ${brief.targetAudience || 'General audience'}
- **Unique Value Proposition**: Combines ${brief.theme} theming with ${brief.goal}

## Market Positioning

The ${brief.theme} theme in ${brief.industry} games shows strong potential for:
1. Immediate visual appeal
2. Clear gameplay metaphors
3. Expandable content universe

## Recommendations

1. Focus on immediate feedback loops
2. Implement progressive difficulty scaling
3. Add social sharing features for viral growth
4. Consider seasonal content updates

---

*Generated by SynthesisAgent v2.1*`;

  await supabaseClient
    .from('orchestrator_artifacts')
    .insert({
      run_id: runId,
      phase: 'synthesis',
      kind: 'theme_analysis',
      path: `runs/${runId}/theme_analysis.md`,
      meta: {
        filename: 'theme_analysis.md',
        size: synthesisContent.length,
        contentType: 'text/markdown',
        data: synthesisContent
      }
    });
}

async function generateBuildArtifacts(supabaseClient: any, runId: string, brief: any) {
  const buildBrief = `# Build Brief: ${brief.theme}

## Technical Requirements

- **Engine**: Phaser 3.70+
- **Resolution**: 720x1280 (mobile portrait)
- **File Size**: <2MB total
- **Performance**: 60fps target, 30fps minimum

## Game Design Document

### Core Loop
1. Player ${brief.theme.includes('space') ? 'pilots spacecraft' : 'navigates challenges'}
2. ${brief.goal.includes('teach') ? 'Educational content integrated into gameplay' : 'Score-based progression system'}
3. Progressive difficulty with ${brief.theme} theming
4. Achievement unlocks and social sharing

### Art Direction
- **Color Palette**: ${brief.theme.includes('space') ? 'Deep blues, cosmic purples, bright stars' : 'Vibrant, accessible colors'}
- **Style**: ${brief.industry === 'education' ? 'Friendly, approachable cartoon style' : 'Modern, sleek design'}
- **UI/UX**: Intuitive touch controls, clear visual hierarchy

### Success Metrics
- Session length: 60-180 seconds
- Replay rate: >40%
- ${brief.industry === 'education' ? 'Learning objective completion: >80%' : 'Share rate: >5%'}

## Implementation Plan

### Phase 1: Core Mechanics (Week 1)
- Basic ${brief.theme} environment
- Core interaction system
- Score/progress tracking

### Phase 2: Content & Polish (Week 2)
- Level progression system
- Visual effects and juice
- Audio integration
- Performance optimization

---

*Generated by BuildAgent v3.2*`;

  await supabaseClient
    .from('orchestrator_artifacts')
    .insert({
      run_id: runId,
      phase: 'build',
      kind: 'build_brief',
      path: `runs/${runId}/build_brief.md`,
      meta: {
        filename: 'build_brief.md',
        size: buildBrief.length,
        contentType: 'text/markdown',
        data: buildBrief
      }
    });
}

// Placeholder functions for other phases
async function generateIntakeArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`📋 Generating intake artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for intake processing
  const intakePrompt = `You are a project intake specialist for game development. Process and validate this game development brief:

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}
Constraints: ${JSON.stringify(brief.constraints || {})}

Analyze and validate this brief, then provide a structured intake report in JSON format with:
1. Brief validation (completeness, clarity, feasibility)
2. Processed requirements and constraints
3. Risk assessment and mitigation strategies
4. Resource estimates and timeline projections
5. Success criteria and KPIs
6. Next phase recommendations

Return ONLY valid JSON with this structure:
{
  "validation": {
    "completeness": 0.0-1.0,
    "clarity": 0.0-1.0,
    "feasibility": 0.0-1.0,
    "overallScore": 0.0-1.0
  },
  "processedRequirements": {
    "coreFeatures": ["feature1", "feature2", ...],
    "technicalConstraints": ["constraint1", "constraint2", ...],
    "businessConstraints": ["constraint1", "constraint2", ...]
  },
  "riskAssessment": {
    "highRisks": ["risk1", "risk2", ...],
    "mitigationStrategies": ["strategy1", "strategy2", ...]
  },
  "estimates": {
    "timelineWeeks": number,
    "complexityScore": 0.0-1.0,
    "resourceRequirements": "description"
  },
  "successCriteria": ["criteria1", "criteria2", ...],
  "recommendations": "Next steps and phase recommendations"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: intakePrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const intakeDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const intakeData = JSON.parse(intakeDataText);
    
    console.log(`✅ Generated intake analysis:`, intakeData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'intake',
        agent: 'intake-specialist',
        level: 'info',
        message: `Brief intake and validation completed for ${brief.theme}`,
        thinking_trace: intakePrompt,
        llm_response: intakeDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'intake',
        kind: 'intake_report',
        path: `runs/${runId}/intake_report.json`,
        meta: {
          filename: 'intake_report.json',
          size: JSON.stringify(intakeData).length,
          contentType: 'application/json',
          data: intakeData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for intake processing:`, error);
    
    // Fallback data
    const fallbackData = {
      validation: {
        completeness: 0.8,
        clarity: 0.7,
        feasibility: 0.9,
        overallScore: 0.8
      },
      processedRequirements: {
        coreFeatures: [`${brief.theme} gameplay`, "User interface", "Scoring system"],
        technicalConstraints: ["Mobile compatibility", "Performance optimization"],
        businessConstraints: ["Budget limitations", "Timeline constraints"]
      },
      riskAssessment: {
        highRisks: ["Technical complexity", "Market competition"],
        mitigationStrategies: ["Phased development", "Market research"]
      },
      estimates: {
        timelineWeeks: 12,
        complexityScore: 0.6,
        resourceRequirements: "Small development team with game design expertise"
      },
      successCriteria: ["User engagement > 70%", "Performance metrics met", "On-time delivery"],
      recommendations: "Proceed to market research phase with validated requirements"
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'intake',
        agent: 'intake-specialist',
        level: 'error',
        message: `Intake processing failed, using fallback: ${error.message}`,
        thinking_trace: intakePrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'intake',
        kind: 'intake_report',
        path: `runs/${runId}/intake_report.json`,
        meta: {
          filename: 'intake_report.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateDeconstructArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🔍 Generating deconstruct artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for game deconstruction analysis
  const deconstructPrompt = `You are a game design analyst specializing in deconstructing successful games. Analyze winning game concepts in the ${brief.theme} theme within the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}

Break down successful games and identify winning patterns. Provide a comprehensive analysis in JSON format with:
1. Top successful games in this theme/industry
2. Core mechanics breakdown and analysis
3. Success patterns and design principles
4. User engagement strategies
5. Monetization approaches
6. Technical implementation patterns
7. Recommendations for our game

Return ONLY valid JSON with this structure:
{
  "successfulGames": [
    {
      "name": "Game Name",
      "description": "Brief description",
      "keyMechanics": ["mechanic1", "mechanic2", ...],
      "successFactors": ["factor1", "factor2", ...]
    }
  ],
  "coreMechanics": {
    "primary": ["mechanic1", "mechanic2", ...],
    "secondary": ["mechanic1", "mechanic2", ...],
    "innovative": ["mechanic1", "mechanic2", ...]
  },
  "successPatterns": {
    "gameplayLoops": ["loop1", "loop2", ...],
    "progressionSystems": ["system1", "system2", ...],
    "engagementHooks": ["hook1", "hook2", ...]
  },
  "userEngagement": {
    "onboardingStrategies": ["strategy1", "strategy2", ...],
    "retentionMechanics": ["mechanic1", "mechanic2", ...],
    "socialFeatures": ["feature1", "feature2", ...]
  },
  "monetizationPatterns": ["pattern1", "pattern2", ...],
  "technicalPatterns": {
    "architecture": "description",
    "performance": ["optimization1", "optimization2", ...],
    "scalability": ["approach1", "approach2", ...]
  },
  "recommendations": "Specific recommendations for implementing these patterns in our game"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: deconstructPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const deconstructDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const deconstructData = JSON.parse(deconstructDataText);
    
    console.log(`✅ Generated deconstruct analysis:`, deconstructData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'deconstruct',
        agent: 'game-design-analyst',
        level: 'info',
        message: `Game deconstruction analysis completed for ${brief.theme}`,
        thinking_trace: deconstructPrompt,
        llm_response: deconstructDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'deconstruct',
        kind: 'deconstruct_analysis',
        path: `runs/${runId}/deconstruct_analysis.json`,
        meta: {
          filename: 'deconstruct_analysis.json',
          size: JSON.stringify(deconstructData).length,
          contentType: 'application/json',
          data: deconstructData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for deconstruct analysis:`, error);
    
    // Fallback data
    const fallbackData = {
      successfulGames: [
        {
          name: `Popular ${brief.theme} Game`,
          description: "A successful game in this theme",
          keyMechanics: ["Core gameplay", "Progression system", "Social features"],
          successFactors: ["Engaging mechanics", "Clear progression", "Social interaction"]
        }
      ],
      coreMechanics: {
        primary: [`${brief.theme} gameplay`, "User interaction", "Scoring system"],
        secondary: ["Achievements", "Leaderboards", "Customization"],
        innovative: ["Unique twist", "Novel interaction", "Creative progression"]
      },
      successPatterns: {
        gameplayLoops: ["Play -> Progress -> Reward", "Challenge -> Master -> Advance"],
        progressionSystems: ["Level-based", "Skill-based", "Collection-based"],
        engagementHooks: ["Daily challenges", "Social competition", "Achievement unlocks"]
      },
      userEngagement: {
        onboardingStrategies: ["Tutorial progression", "Guided first experience", "Quick wins"],
        retentionMechanics: ["Daily rewards", "Progress streaks", "Social features"],
        socialFeatures: ["Leaderboards", "Sharing", "Multiplayer modes"]
      },
      monetizationPatterns: ["Freemium model", "In-app purchases", "Ad-supported"],
      technicalPatterns: {
        architecture: "Client-server with offline capability",
        performance: ["Optimized rendering", "Efficient data structures", "Memory management"],
        scalability: ["Cloud backend", "CDN delivery", "Load balancing"]
      },
      recommendations: `Focus on core ${brief.theme} mechanics with clear progression and social features`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'deconstruct',
        agent: 'game-design-analyst',
        level: 'error',
        message: `Deconstruct analysis failed, using fallback: ${error.message}`,
        thinking_trace: deconstructPrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'deconstruct',
        kind: 'deconstruct_analysis',
        path: `runs/${runId}/deconstruct_analysis.json`,
        meta: {
          filename: 'deconstruct_analysis.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generatePrioritizeArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🎯 Generating prioritize artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for opportunity prioritization
  const prioritizePrompt = `You are a product strategy consultant specializing in game development prioritization. Based on market research and game analysis, prioritize opportunities for a ${brief.theme} game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}
Constraints: ${JSON.stringify(brief.constraints || {})}

Analyze and prioritize development opportunities. Provide a comprehensive prioritization report in JSON format with:
1. Ranked feature opportunities with impact/effort scoring
2. Development roadmap with phases and timelines
3. Resource allocation recommendations
4. Risk-adjusted priority matrix
5. MVP definition and scope
6. Success metrics and KPIs
7. Go-to-market strategy priorities

Return ONLY valid JSON with this structure:
{
  "prioritizedFeatures": [
    {
      "feature": "Feature Name",
      "description": "Feature description",
      "impactScore": 0.0-1.0,
      "effortScore": 0.0-1.0,
      "priorityScore": 0.0-1.0,
      "category": "core|enhancement|nice-to-have",
      "dependencies": ["dependency1", "dependency2", ...]
    }
  ],
  "developmentRoadmap": {
    "mvp": {
      "features": ["feature1", "feature2", ...],
      "timelineWeeks": number,
      "resources": "description"
    },
    "phase1": {
      "features": ["feature1", "feature2", ...],
      "timelineWeeks": number,
      "resources": "description"
    },
    "phase2": {
      "features": ["feature1", "feature2", ...],
      "timelineWeeks": number,
      "resources": "description"
    }
  },
  "resourceAllocation": {
    "development": 0.0-1.0,
    "design": 0.0-1.0,
    "testing": 0.0-1.0,
    "marketing": 0.0-1.0
  },
  "riskMatrix": [
    {
      "opportunity": "Opportunity name",
      "risk": "Risk description",
      "probability": 0.0-1.0,
      "impact": 0.0-1.0,
      "mitigation": "Mitigation strategy"
    }
  ],
  "successMetrics": {
    "primary": ["metric1", "metric2", ...],
    "secondary": ["metric1", "metric2", ...],
    "targets": {
      "userEngagement": "target",
      "retention": "target",
      "monetization": "target"
    }
  },
  "goToMarketPriorities": ["priority1", "priority2", ...],
  "recommendations": "Strategic recommendations for execution"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prioritizePrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const prioritizeDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const prioritizeData = JSON.parse(prioritizeDataText);
    
    console.log(`✅ Generated prioritization analysis:`, prioritizeData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'prioritize',
        agent: 'product-strategist',
        level: 'info',
        message: `Opportunity prioritization completed for ${brief.theme}`,
        thinking_trace: prioritizePrompt,
        llm_response: prioritizeDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'prioritize',
        kind: 'priority_matrix',
        path: `runs/${runId}/priority_matrix.json`,
        meta: {
          filename: 'priority_matrix.json',
          size: JSON.stringify(prioritizeData).length,
          contentType: 'application/json',
          data: prioritizeData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for prioritization:`, error);
    
    // Fallback data
    const fallbackData = {
      prioritizedFeatures: [
        {
          feature: `Core ${brief.theme} Gameplay`,
          description: "Primary game mechanics and interactions",
          impactScore: 0.9,
          effortScore: 0.7,
          priorityScore: 0.9,
          category: "core",
          dependencies: []
        },
        {
          feature: "User Interface",
          description: "Intuitive and responsive UI/UX",
          impactScore: 0.8,
          effortScore: 0.5,
          priorityScore: 0.8,
          category: "core",
          dependencies: ["Core Gameplay"]
        },
        {
          feature: "Progression System",
          description: "Player advancement and rewards",
          impactScore: 0.7,
          effortScore: 0.6,
          priorityScore: 0.7,
          category: "enhancement",
          dependencies: ["Core Gameplay"]
        }
      ],
      developmentRoadmap: {
        mvp: {
          features: [`Core ${brief.theme} Gameplay`, "Basic UI", "Scoring System"],
          timelineWeeks: 8,
          resources: "2 developers, 1 designer"
        },
        phase1: {
          features: ["Progression System", "Enhanced UI", "Audio Integration"],
          timelineWeeks: 6,
          resources: "2 developers, 1 designer, 1 audio specialist"
        },
        phase2: {
          features: ["Social Features", "Advanced Analytics", "Monetization"],
          timelineWeeks: 4,
          resources: "Full team + marketing support"
        }
      },
      resourceAllocation: {
        development: 0.6,
        design: 0.2,
        testing: 0.15,
        marketing: 0.05
      },
      riskMatrix: [
        {
          opportunity: "Market Leadership",
          risk: "Competition from established players",
          probability: 0.7,
          impact: 0.8,
          mitigation: "Focus on unique differentiators and rapid iteration"
        }
      ],
      successMetrics: {
        primary: ["Daily Active Users", "Session Duration", "User Retention"],
        secondary: ["App Store Rating", "Social Shares", "Revenue per User"],
        targets: {
          userEngagement: "> 5 minutes average session",
          retention: "> 40% Day 7 retention",
          monetization: "> $0.50 ARPU"
        }
      },
      goToMarketPriorities: ["App Store Optimization", "Influencer Partnerships", "Social Media Campaign"],
      recommendations: `Focus on MVP delivery with core ${brief.theme} mechanics, then iterate based on user feedback`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'prioritize',
        agent: 'product-strategist',
        level: 'error',
        message: `Prioritization analysis failed, using fallback: ${error.message}`,
        thinking_trace: prioritizePrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'prioritize',
        kind: 'priority_matrix',
        path: `runs/${runId}/priority_matrix.json`,
        meta: {
          filename: 'priority_matrix.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateQAArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🧪 Generating QA artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for QA testing strategy
  const qaPrompt = `You are a QA specialist for mobile game testing. Create a comprehensive testing strategy and quality assurance plan for a ${brief.theme} game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}

Develop a complete QA strategy and testing plan. Provide a comprehensive report in JSON format with:
1. Testing strategy and approach
2. Test cases and scenarios
3. Performance benchmarks and criteria
4. Device compatibility matrix
5. User acceptance testing plan
6. Bug tracking and resolution process
7. Quality metrics and success criteria

Return ONLY valid JSON with this structure:
{
  "testingStrategy": {
    "approach": "description of testing methodology",
    "phases": ["phase1", "phase2", ...],
    "tools": ["tool1", "tool2", ...],
    "timeline": "testing timeline"
  },
  "testCases": [
    {
      "category": "Functional|Performance|Usability|Security",
      "scenario": "Test scenario description",
      "steps": ["step1", "step2", ...],
      "expectedResult": "Expected outcome",
      "priority": "High|Medium|Low"
    }
  ],
  "performanceBenchmarks": {
    "loadTime": "target load time",
    "frameRate": "target FPS",
    "memoryUsage": "max memory usage",
    "batteryLife": "battery impact target"
  },
  "deviceCompatibility": {
    "minimumSpecs": {
      "os": "minimum OS version",
      "ram": "minimum RAM",
      "storage": "minimum storage"
    },
    "testDevices": ["device1", "device2", ...],
    "screenSizes": ["size1", "size2", ...]
  },
  "userAcceptanceTesting": {
    "criteria": ["criteria1", "criteria2", ...],
    "testGroups": ["group1", "group2", ...],
    "successMetrics": ["metric1", "metric2", ...]
  },
  "bugTracking": {
    "severity": ["Critical", "High", "Medium", "Low"],
    "workflow": ["step1", "step2", ...],
    "resolutionTargets": {
      "critical": "time target",
      "high": "time target",
      "medium": "time target",
      "low": "time target"
    }
  },
  "qualityMetrics": {
    "crashRate": "target crash rate",
    "userRating": "target app store rating",
    "performanceScore": "target performance score"
  },
  "recommendations": "QA strategy recommendations and best practices"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: qaPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const qaDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const qaData = JSON.parse(qaDataText);
    
    console.log(`✅ Generated QA strategy:`, qaData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'qa',
        agent: 'qa-specialist',
        level: 'info',
        message: `QA strategy and testing plan completed for ${brief.theme}`,
        thinking_trace: qaPrompt,
        llm_response: qaDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'qa',
        kind: 'qa_strategy',
        path: `runs/${runId}/qa_strategy.json`,
        meta: {
          filename: 'qa_strategy.json',
          size: JSON.stringify(qaData).length,
          contentType: 'application/json',
          data: qaData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for QA strategy:`, error);
    
    // Fallback data
    const fallbackData = {
      testingStrategy: {
        approach: "Comprehensive testing covering functional, performance, and usability aspects",
        phases: ["Unit Testing", "Integration Testing", "System Testing", "User Acceptance Testing"],
        tools: ["Automated Testing Framework", "Performance Monitoring", "Device Testing Lab"],
        timeline: "4 weeks parallel with development"
      },
      testCases: [
        {
          category: "Functional",
          scenario: `Test core ${brief.theme} gameplay mechanics`,
          steps: ["Launch game", "Interact with main mechanics", "Verify responses", "Check scoring"],
          expectedResult: "All gameplay mechanics work as designed",
          priority: "High"
        },
        {
          category: "Performance",
          scenario: "Test game performance under load",
          steps: ["Run extended gameplay session", "Monitor frame rate", "Check memory usage"],
          expectedResult: "Maintains 60 FPS with <100MB memory usage",
          priority: "High"
        }
      ],
      performanceBenchmarks: {
        loadTime: "< 3 seconds",
        frameRate: "60 FPS",
        memoryUsage: "< 100MB",
        batteryLife: "< 5% drain per hour"
      },
      deviceCompatibility: {
        minimumSpecs: {
          os: "iOS 12+ / Android 8+",
          ram: "2GB",
          storage: "100MB"
        },
        testDevices: ["iPhone 12", "Samsung Galaxy S21", "iPad Air", "Google Pixel 5"],
        screenSizes: ["4.7 inch", "6.1 inch", "6.7 inch", "10.9 inch tablet"]
      },
      userAcceptanceTesting: {
        criteria: ["Intuitive gameplay", "Engaging experience", "Bug-free operation"],
        testGroups: ["Target demographic", "Gaming enthusiasts", "Casual users"],
        successMetrics: ["90% task completion", "4+ star rating", "< 1% crash rate"]
      },
      bugTracking: {
        severity: ["Critical", "High", "Medium", "Low"],
        workflow: ["Report", "Triage", "Assign", "Fix", "Verify", "Close"],
        resolutionTargets: {
          critical: "24 hours",
          high: "72 hours",
          medium: "1 week",
          low: "2 weeks"
        }
      },
      qualityMetrics: {
        crashRate: "< 1%",
        userRating: "> 4.0 stars",
        performanceScore: "> 85/100"
      },
      recommendations: `Focus on core ${brief.theme} mechanics testing with emphasis on performance optimization and user experience validation`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'qa',
        agent: 'qa-specialist',
        level: 'error',
        message: `QA strategy generation failed, using fallback: ${error.message}`,
        thinking_trace: qaPrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'qa',
        kind: 'qa_strategy',
        path: `runs/${runId}/qa_strategy.json`,
        meta: {
          filename: 'qa_strategy.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateDeployArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🚀 Generating deploy artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for deployment strategy
  const deployPrompt = `You are a mobile app deployment specialist. Create a comprehensive deployment strategy and distribution plan for a ${brief.theme} game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}

Develop a complete deployment and distribution strategy. Provide a comprehensive plan in JSON format with:
1. App store optimization strategy
2. Distribution platform selection
3. Release timeline and phases
4. Marketing and promotion plan
5. Technical deployment requirements
6. Monitoring and analytics setup
7. Post-launch support strategy

Return ONLY valid JSON with this structure:
{
  "appStoreOptimization": {
    "title": "optimized app title",
    "description": "compelling app description",
    "keywords": ["keyword1", "keyword2", ...],
    "screenshots": ["screenshot1 description", "screenshot2 description", ...],
    "icon": "icon design description",
    "category": "app store category"
  },
  "distributionPlatforms": [
    {
      "platform": "iOS App Store|Google Play|Web|Steam",
      "priority": "High|Medium|Low",
      "requirements": ["requirement1", "requirement2", ...],
      "timeline": "deployment timeline"
    }
  ],
  "releaseStrategy": {
    "phases": [
      {
        "phase": "Beta|Soft Launch|Global Launch",
        "timeline": "phase timeline",
        "scope": "release scope",
        "objectives": ["objective1", "objective2", ...]
      }
    ],
    "rolloutPlan": "gradual rollout strategy"
  },
  "marketingPlan": {
    "prelaunch": ["activity1", "activity2", ...],
    "launch": ["activity1", "activity2", ...],
    "postlaunch": ["activity1", "activity2", ...],
    "channels": ["channel1", "channel2", ...],
    "budget": "marketing budget allocation"
  },
  "technicalRequirements": {
    "buildConfiguration": "production build settings",
    "certificates": ["certificate1", "certificate2", ...],
    "infrastructure": ["requirement1", "requirement2", ...],
    "cdn": "content delivery setup"
  },
  "analytics": {
    "platforms": ["platform1", "platform2", ...],
    "metrics": ["metric1", "metric2", ...],
    "dashboards": ["dashboard1", "dashboard2", ...],
    "alerts": ["alert1", "alert2", ...]
  },
  "supportStrategy": {
    "channels": ["channel1", "channel2", ...],
    "documentation": ["doc1", "doc2", ...],
    "updateSchedule": "regular update plan",
    "communityManagement": "community engagement strategy"
  },
  "recommendations": "Deployment strategy recommendations and best practices"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: deployPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const deployDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const deployData = JSON.parse(deployDataText);
    
    console.log(`✅ Generated deployment strategy:`, deployData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'deploy',
        agent: 'deployment-specialist',
        level: 'info',
        message: `Deployment strategy completed for ${brief.theme}`,
        thinking_trace: deployPrompt,
        llm_response: deployDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'deploy',
        kind: 'deployment_plan',
        path: `runs/${runId}/deployment_plan.json`,
        meta: {
          filename: 'deployment_plan.json',
          size: JSON.stringify(deployData).length,
          contentType: 'application/json',
          data: deployData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for deployment strategy:`, error);
    
    // Fallback data
    const fallbackData = {
      appStoreOptimization: {
        title: `${brief.theme} - Mobile Game`,
        description: `Engaging ${brief.theme} game for ${brief.targetAudience || 'everyone'}. ${brief.goal}`,
        keywords: [brief.theme.toLowerCase(), "game", "mobile", "fun", brief.industry.toLowerCase()],
        screenshots: ["Gameplay screenshot", "Menu interface", "Achievement screen", "Leaderboard view"],
        icon: `Colorful icon featuring ${brief.theme} elements`,
        category: "Games"
      },
      distributionPlatforms: [
        {
          platform: "iOS App Store",
          priority: "High",
          requirements: ["Apple Developer Account", "App Store Review", "iOS Build"],
          timeline: "2-3 weeks"
        },
        {
          platform: "Google Play",
          priority: "High",
          requirements: ["Google Play Console", "Android Build", "Content Rating"],
          timeline: "1-2 weeks"
        }
      ],
      releaseStrategy: {
        phases: [
          {
            phase: "Beta",
            timeline: "2 weeks",
            scope: "Closed testing with 100 users",
            objectives: ["Bug identification", "Performance validation", "User feedback"]
          },
          {
            phase: "Soft Launch",
            timeline: "4 weeks",
            scope: "Limited geographic release",
            objectives: ["Market validation", "Performance monitoring", "Optimization"]
          },
          {
            phase: "Global Launch",
            timeline: "Ongoing",
            scope: "Worldwide availability",
            objectives: ["User acquisition", "Revenue generation", "Market expansion"]
          }
        ],
        rolloutPlan: "Gradual rollout starting with 10% users, increasing to 100% over 1 week"
      },
      marketingPlan: {
        prelaunch: ["Social media teasers", "Influencer outreach", "Press kit preparation"],
        launch: ["Launch announcement", "App store featuring", "Social media campaign"],
        postlaunch: ["User feedback collection", "Content updates", "Community engagement"],
        channels: ["Social Media", "Gaming Blogs", "YouTube", "App Store Features"],
        budget: "Allocate 30% for pre-launch, 50% for launch, 20% for post-launch"
      },
      technicalRequirements: {
        buildConfiguration: "Release build with optimizations enabled",
        certificates: ["iOS Distribution Certificate", "Android Signing Key"],
        infrastructure: ["CDN setup", "Analytics integration", "Crash reporting"],
        cdn: "Global CDN for asset delivery and reduced load times"
      },
      analytics: {
        platforms: ["Google Analytics", "Firebase Analytics", "App Store Connect"],
        metrics: ["DAU", "Session Length", "Retention Rate", "Revenue", "Crash Rate"],
        dashboards: ["User Engagement", "Performance Metrics", "Revenue Tracking"],
        alerts: ["Crash rate > 1%", "DAU drop > 20%", "Revenue anomalies"]
      },
      supportStrategy: {
        channels: ["In-app support", "Email support", "Social media"],
        documentation: ["User guide", "FAQ", "Troubleshooting"],
        updateSchedule: "Bi-weekly updates with bug fixes and new content",
        communityManagement: "Active engagement on social platforms and forums"
      },
      recommendations: `Focus on iOS and Android app stores with strong ASO strategy. Implement gradual rollout with comprehensive analytics tracking for ${brief.theme} game success.`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'deploy',
        agent: 'deployment-specialist',
        level: 'error',
        message: `Deployment strategy generation failed, using fallback: ${error.message}`,
        thinking_trace: deployPrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'deploy',
        kind: 'deployment_plan',
        path: `runs/${runId}/deployment_plan.json`,
        meta: {
          filename: 'deployment_plan.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateMeasureArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`📊 Generating measure artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for analytics and measurement strategy
  const measurePrompt = `You are a mobile game analytics specialist. Create a comprehensive measurement and analytics strategy for a ${brief.theme} game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}

Develop a complete analytics and measurement framework. Provide a comprehensive report in JSON format with:
1. Key performance indicators (KPIs) and metrics
2. Analytics implementation plan
3. User behavior tracking strategy
4. Performance monitoring setup
5. Revenue and monetization tracking
6. A/B testing framework
7. Reporting and dashboard configuration

Return ONLY valid JSON with this structure:
{
  "kpis": {
    "primary": [
      {
        "metric": "metric name",
        "description": "what it measures",
        "target": "target value",
        "frequency": "measurement frequency"
      }
    ],
    "secondary": [
      {
        "metric": "metric name",
        "description": "what it measures",
        "target": "target value",
        "frequency": "measurement frequency"
      }
    ]
  },
  "analyticsImplementation": {
    "platforms": ["platform1", "platform2", ...],
    "sdks": ["sdk1", "sdk2", ...],
    "customEvents": [
      {
        "event": "event name",
        "description": "event description",
        "parameters": ["param1", "param2", ...]
      }
    ],
    "funnels": ["funnel1", "funnel2", ...]
  },
  "userBehaviorTracking": {
    "sessionTracking": {
      "events": ["session_start", "session_end", ...],
      "properties": ["duration", "screens_visited", ...]
    },
    "gameplayTracking": {
      "events": ["level_start", "level_complete", ...],
      "properties": ["score", "time", "attempts", ...]
    },
    "engagementTracking": {
      "events": ["feature_used", "tutorial_completed", ...],
      "properties": ["feature_name", "completion_rate", ...]
    }
  },
  "performanceMonitoring": {
    "metrics": ["crash_rate", "load_time", "frame_rate", ...],
    "thresholds": {
      "crash_rate": "< 1%",
      "load_time": "< 3s",
      "frame_rate": "> 30 FPS"
    },
    "alerts": ["alert1", "alert2", ...]
  },
  "revenueTracking": {
    "metrics": ["ARPU", "LTV", "conversion_rate", ...],
    "events": ["purchase", "ad_view", "subscription", ...],
    "cohortAnalysis": "monthly cohort tracking",
    "revenueStreams": ["in_app_purchases", "ads", "subscriptions"]
  },
  "abTesting": {
    "framework": "testing framework",
    "testTypes": ["feature_tests", "ui_tests", "monetization_tests"],
    "metrics": ["conversion", "retention", "revenue"],
    "duration": "typical test duration"
  },
  "dashboards": [
    {
      "name": "dashboard name",
      "purpose": "dashboard purpose",
      "metrics": ["metric1", "metric2", ...],
      "audience": "target audience"
    }
  ],
  "recommendations": "Analytics strategy recommendations and implementation best practices"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: measurePrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const measureDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const measureData = JSON.parse(measureDataText);
    
    console.log(`✅ Generated measurement strategy:`, measureData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'measure',
        agent: 'analytics-specialist',
        level: 'info',
        message: `Analytics and measurement strategy completed for ${brief.theme}`,
        thinking_trace: measurePrompt,
        llm_response: measureDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'measure',
        kind: 'analytics_plan',
        path: `runs/${runId}/analytics_plan.json`,
        meta: {
          filename: 'analytics_plan.json',
          size: JSON.stringify(measureData).length,
          contentType: 'application/json',
          data: measureData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for measurement strategy:`, error);
    
    // Fallback data
    const fallbackData = {
      kpis: {
        primary: [
          {
            metric: "Daily Active Users (DAU)",
            description: "Number of unique users playing daily",
            target: "1000+ users",
            frequency: "Daily"
          },
          {
            metric: "Session Duration",
            description: "Average time spent per session",
            target: "> 5 minutes",
            frequency: "Daily"
          },
          {
            metric: "Day 7 Retention",
            description: "Percentage of users returning after 7 days",
            target: "> 40%",
            frequency: "Weekly"
          }
        ],
        secondary: [
          {
            metric: "App Store Rating",
            description: "Average user rating on app stores",
            target: "> 4.0 stars",
            frequency: "Weekly"
          },
          {
            metric: "Crash Rate",
            description: "Percentage of sessions with crashes",
            target: "< 1%",
            frequency: "Daily"
          }
        ]
      },
      analyticsImplementation: {
        platforms: ["Firebase Analytics", "Google Analytics", "Custom Analytics"],
        sdks: ["Firebase SDK", "Analytics SDK", "Crash Reporting SDK"],
        customEvents: [
          {
            event: "game_start",
            description: "User starts a new game session",
            parameters: ["user_id", "level", "timestamp"]
          },
          {
            event: "level_complete",
            description: "User completes a level",
            parameters: ["level_id", "score", "time_taken", "attempts"]
          }
        ],
        funnels: ["Onboarding Funnel", "Level Progression", "Monetization Funnel"]
      },
      userBehaviorTracking: {
        sessionTracking: {
          events: ["session_start", "session_end", "app_background", "app_foreground"],
          properties: ["duration", "screens_visited", "actions_taken"]
        },
        gameplayTracking: {
          events: ["level_start", "level_complete", "level_fail", "power_up_used"],
          properties: ["score", "time", "attempts", "difficulty"]
        },
        engagementTracking: {
          events: ["tutorial_start", "tutorial_complete", "feature_discovered", "achievement_unlocked"],
          properties: ["feature_name", "completion_rate", "time_to_complete"]
        }
      },
      performanceMonitoring: {
        metrics: ["crash_rate", "load_time", "frame_rate", "memory_usage", "battery_drain"],
        thresholds: {
          crash_rate: "< 1%",
          load_time: "< 3s",
          frame_rate: "> 30 FPS"
        },
        alerts: ["Crash rate exceeds 1%", "Load time exceeds 5s", "Memory usage > 150MB"]
      },
      revenueTracking: {
        metrics: ["ARPU", "LTV", "conversion_rate", "purchase_frequency"],
        events: ["purchase_initiated", "purchase_completed", "ad_viewed", "subscription_started"],
        cohortAnalysis: "Track user value by monthly cohorts",
        revenueStreams: ["In-app purchases", "Rewarded ads", "Banner ads"]
      },
      abTesting: {
        framework: "Firebase Remote Config + A/B Testing",
        testTypes: ["UI variations", "Gameplay mechanics", "Monetization strategies"],
        metrics: ["conversion_rate", "retention_rate", "revenue_per_user"],
        duration: "2-4 weeks per test"
      },
      dashboards: [
        {
          name: "Executive Dashboard",
          purpose: "High-level KPIs for leadership",
          metrics: ["DAU", "Revenue", "Retention", "App Store Rating"],
          audience: "Executives and stakeholders"
        },
        {
          name: "Product Dashboard",
          purpose: "Detailed user behavior and engagement",
          metrics: ["Session data", "Feature usage", "User flows", "Conversion funnels"],
          audience: "Product managers and designers"
        },
        {
          name: "Technical Dashboard",
          purpose: "Performance and stability monitoring",
          metrics: ["Crash rate", "Load times", "Performance metrics", "Error logs"],
          audience: "Development team"
        }
      ],
      recommendations: `Implement comprehensive analytics from day 1 with focus on ${brief.theme} specific metrics. Set up automated alerts and regular reporting cadence for data-driven optimization.`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'measure',
        agent: 'analytics-specialist',
        level: 'error',
        message: `Measurement strategy generation failed, using fallback: ${error.message}`,
        thinking_trace: measurePrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'measure',
        kind: 'analytics_plan',
        path: `runs/${runId}/analytics_plan.json`,
        meta: {
          filename: 'analytics_plan.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

async function generateDecisionArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🎯 Generating decision artifacts for ${brief.theme}`);
  
  // Real LLM call to Claude for strategic decision making
  const decisionPrompt = `You are a strategic decision consultant for mobile game development. Analyze the complete development cycle and provide strategic recommendations for a ${brief.theme} game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}

Based on the full development cycle, provide comprehensive strategic recommendations. Provide a detailed analysis in JSON format with:
1. Performance evaluation and key findings
2. Strategic recommendations for next steps
3. Iteration and improvement opportunities
4. Resource allocation recommendations
5. Market positioning strategy
6. Risk assessment and mitigation
7. Long-term roadmap and vision

Return ONLY valid JSON with this structure:
{
  "performanceEvaluation": {
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "opportunities": ["opportunity1", "opportunity2", ...],
    "threats": ["threat1", "threat2", ...],
    "overallScore": 0.0-1.0,
    "keyFindings": ["finding1", "finding2", ...]
  },
  "strategicRecommendations": {
    "immediate": [
      {
        "action": "action description",
        "priority": "High|Medium|Low",
        "timeline": "timeframe",
        "resources": "required resources",
        "expectedImpact": "impact description"
      }
    ],
    "shortTerm": [
      {
        "action": "action description",
        "priority": "High|Medium|Low",
        "timeline": "timeframe",
        "resources": "required resources",
        "expectedImpact": "impact description"
      }
    ],
    "longTerm": [
      {
        "action": "action description",
        "priority": "High|Medium|Low",
        "timeline": "timeframe",
        "resources": "required resources",
        "expectedImpact": "impact description"
      }
    ]
  },
  "iterationOpportunities": {
    "gameplayImprovements": ["improvement1", "improvement2", ...],
    "userExperienceEnhancements": ["enhancement1", "enhancement2", ...],
    "monetizationOptimizations": ["optimization1", "optimization2", ...],
    "technicalUpgrades": ["upgrade1", "upgrade2", ...]
  },
  "resourceAllocation": {
    "nextQuarter": {
      "development": 0.0-1.0,
      "marketing": 0.0-1.0,
      "analytics": 0.0-1.0,
      "userAcquisition": 0.0-1.0
    },
    "teamExpansion": ["role1", "role2", ...],
    "budgetPriorities": ["priority1", "priority2", ...]
  },
  "marketPositioning": {
    "competitiveAdvantage": "unique value proposition",
    "targetSegments": ["segment1", "segment2", ...],
    "pricingStrategy": "pricing approach",
    "distributionChannels": ["channel1", "channel2", ...]
  },
  "riskAssessment": {
    "highRisks": [
      {
        "risk": "risk description",
        "probability": 0.0-1.0,
        "impact": 0.0-1.0,
        "mitigation": "mitigation strategy"
      }
    ],
    "contingencyPlans": ["plan1", "plan2", ...],
    "monitoringMetrics": ["metric1", "metric2", ...]
  },
  "longTermRoadmap": {
    "vision": "long-term vision statement",
    "milestones": [
      {
        "milestone": "milestone description",
        "timeline": "timeframe",
        "success criteria": ["criteria1", "criteria2", ...]
      }
    ],
    "expansionOpportunities": ["opportunity1", "opportunity2", ...],
    "exitStrategies": ["strategy1", "strategy2", ...]
  },
  "recommendations": "Executive summary of key strategic recommendations and next steps"
}`;

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    // Make actual LLM API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: decisionPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const llmResult = await response.json();
    const decisionDataText = llmResult.content[0].text;
    
    // Parse the JSON response
    const decisionData = JSON.parse(decisionDataText);
    
    console.log(`✅ Generated strategic decision analysis:`, decisionData);

    // Store thinking trace in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'decision',
        agent: 'strategic-consultant',
        level: 'info',
        message: `Strategic decision analysis completed for ${brief.theme}`,
        thinking_trace: decisionPrompt,
        llm_response: decisionDataText,
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'decision',
        kind: 'strategic_recommendations',
        path: `runs/${runId}/strategic_recommendations.json`,
        meta: {
          filename: 'strategic_recommendations.json',
          size: JSON.stringify(decisionData).length,
          contentType: 'application/json',
          data: decisionData,
          llm_model: 'claude-3-5-sonnet-20241022',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for strategic decision analysis:`, error);
    
    // Fallback data
    const fallbackData = {
      performanceEvaluation: {
        strengths: [`Strong ${brief.theme} concept`, "Clear target audience", "Comprehensive development approach"],
        weaknesses: ["Market competition", "Resource constraints", "Technical complexity"],
        opportunities: ["Market expansion", "Feature enhancement", "Monetization optimization"],
        threats: ["Competitive pressure", "Market saturation", "Technical challenges"],
        overallScore: 0.75,
        keyFindings: ["Solid foundation established", "Market validation needed", "Iterative improvement required"]
      },
      strategicRecommendations: {
        immediate: [
          {
            action: "Launch MVP and gather user feedback",
            priority: "High",
            timeline: "2 weeks",
            resources: "Development team + analytics",
            expectedImpact: "User validation and initial market traction"
          }
        ],
        shortTerm: [
          {
            action: "Implement user feedback and optimize core gameplay",
            priority: "High",
            timeline: "1-2 months",
            resources: "Full development team",
            expectedImpact: "Improved user engagement and retention"
          }
        ],
        longTerm: [
          {
            action: "Expand to additional platforms and markets",
            priority: "Medium",
            timeline: "6-12 months",
            resources: "Expanded team + marketing budget",
            expectedImpact: "Market expansion and revenue growth"
          }
        ]
      },
      iterationOpportunities: {
        gameplayImprovements: ["Enhanced difficulty progression", "Additional game modes", "Social features"],
        userExperienceEnhancements: ["Improved onboarding", "Better UI/UX", "Performance optimization"],
        monetizationOptimizations: ["Balanced IAP strategy", "Rewarded ad integration", "Subscription options"],
        technicalUpgrades: ["Cross-platform support", "Cloud save functionality", "Advanced analytics"]
      },
      resourceAllocation: {
        nextQuarter: {
          development: 0.5,
          marketing: 0.3,
          analytics: 0.1,
          userAcquisition: 0.1
        },
        teamExpansion: ["Marketing specialist", "Data analyst", "Community manager"],
        budgetPriorities: ["User acquisition", "Feature development", "Infrastructure scaling"]
      },
      marketPositioning: {
        competitiveAdvantage: `Unique ${brief.theme} approach with focus on ${brief.targetAudience || 'broad appeal'}`,
        targetSegments: [brief.targetAudience || "Casual gamers", "Mobile game enthusiasts", `${brief.theme} fans`],
        pricingStrategy: "Freemium with optional premium features",
        distributionChannels: ["App Store", "Google Play", "Social media marketing"]
      },
      riskAssessment: {
        highRisks: [
          {
            risk: "Market competition from established players",
            probability: 0.7,
            impact: 0.8,
            mitigation: "Focus on unique differentiators and rapid iteration"
          },
          {
            risk: "User acquisition costs exceeding budget",
            probability: 0.6,
            impact: 0.7,
            mitigation: "Organic growth strategies and referral programs"
          }
        ],
        contingencyPlans: ["Pivot strategy if market response is poor", "Alternative monetization models", "Platform diversification"],
        monitoringMetrics: ["User acquisition cost", "Lifetime value", "Market share", "Competitive positioning"]
      },
      longTermRoadmap: {
        vision: `Become the leading ${brief.theme} mobile game with global reach and strong community`,
        milestones: [
          {
            milestone: "Achieve 100K downloads",
            timeline: "3 months",
            "success criteria": ["User engagement > 70%", "4+ star rating", "Positive revenue"]
          },
          {
            milestone: "Launch in 5 additional markets",
            timeline: "6 months",
            "success criteria": ["Localization complete", "Market-specific features", "Local partnerships"]
          }
        ],
        expansionOpportunities: ["Sequel development", "Franchise expansion", "Cross-media opportunities"],
        exitStrategies: ["Acquisition by major publisher", "IPO consideration", "Licensing opportunities"]
      },
      recommendations: `Focus on MVP launch with strong analytics foundation. Prioritize user feedback integration and iterative improvement. Build sustainable growth through organic acquisition and community building around ${brief.theme} theme.`
    };

    // Store error log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'decision',
        agent: 'strategic-consultant',
        level: 'error',
        message: `Strategic decision analysis failed, using fallback: ${error.message}`,
        thinking_trace: decisionPrompt,
        llm_response: JSON.stringify(fallbackData),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'decision',
        kind: 'strategic_recommendations',
        path: `runs/${runId}/strategic_recommendations.json`,
        meta: {
          filename: 'strategic_recommendations.json',
          size: JSON.stringify(fallbackData).length,
          contentType: 'application/json',
          data: fallbackData,
          fallback: true,
          error: error.message
        }
      });
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    // The path comes as /orchestrator-api/... so we need to remove that prefix
    const path = url.pathname.replace('/orchestrator-api', '') || '/'
    const method = req.method

    // Log requests for monitoring
    console.log(`${method} ${path}`)

    // Routes
    if (method === 'GET' && path === '/runs') {
      // List all runs
      const { data: runs, error } = await supabaseClient
        .from('orchestrator_runs')
        .select(`
          *,
          blockers:orchestrator_manual_tasks(*)
        `)
        .order('created_at', { ascending: false })

      console.log('🔍 Runs query result:', { runs: runs?.length, error })

      if (error) {
        console.error('❌ Runs query error:', error)
        throw error
      }

      return new Response(
        JSON.stringify(runs),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (method === 'POST' && path === '/runs') {
      // Create new run
      const body = await req.json()
      
      const { data: run, error } = await supabaseClient
        .from('orchestrator_runs')
        .insert({
          brief: body.brief,
          status: 'queued',
          phase: 'intake'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify(run),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201 
        }
      )
    }

    if (method === 'POST' && path.match(/^\/runs\/[^\/]+\/advance$/)) {
      // Advance run to next phase
      const runId = path.split('/')[2]
      
      // Get current run
      const { data: currentRun, error: fetchError } = await supabaseClient
        .from('orchestrator_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Determine next phase and status
      const phaseOrder = ['intake', 'market', 'synthesis', 'deconstruct', 'prioritize', 'build', 'qa', 'deploy', 'measure', 'decision']
      const currentPhaseIndex = phaseOrder.indexOf(currentRun.phase)
      
      let nextPhase = currentRun.phase
      let nextStatus = 'running'
      
      if (currentRun.status === 'queued') {
        nextStatus = 'running'
      } else if (currentRun.status === 'running' || currentRun.status === 'awaiting_human') {
        // Advance to next phase
        if (currentPhaseIndex < phaseOrder.length - 1) {
          nextPhase = phaseOrder[currentPhaseIndex + 1]
          nextStatus = 'running'
        } else {
          nextStatus = 'done'
        }
      }

      // Simulate LLM processing with realistic delays and potential human intervention
      const shouldRequireHuman = Math.random() < 0.3 // 30% chance of requiring human intervention
      if (nextStatus === 'running' && shouldRequireHuman && ['synthesis', 'prioritize', 'qa'].includes(nextPhase)) {
        nextStatus = 'awaiting_human'
        
        // Create a manual task
        await supabaseClient
          .from('orchestrator_manual_tasks')
          .insert({
                  run_id: runId,
                  phase: nextPhase,
                  task_type: 'portfolio_approval',
                  status: 'open',
                  title: `Review ${nextPhase} phase results`,
                  description: `Please review the ${nextPhase} phase output and approve to continue.`,
                  assignee: 'operator'
          })
      }

      const { data: run, error } = await supabaseClient
        .from('orchestrator_runs')
        .update({
          status: nextStatus,
          phase: nextPhase,
          updated_at: new Date().toISOString()
        })
        .eq('id', runId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Generate artifacts for the completed phase
      await generatePhaseArtifacts(supabaseClient, runId, currentRun.phase, currentRun.brief);
      
      // Log the advancement
      console.log(`🚀 Run ${runId} advanced from ${currentRun.phase}:${currentRun.status} to ${nextPhase}:${nextStatus}`)

      return new Response(
        JSON.stringify({ success: true, run }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

        if (method === 'DELETE' && path.match(/^\/runs\/[^\/]+$/)) {
          // Delete run
          const runId = path.split('/')[2]

          // Delete associated tasks first
          await supabaseClient
            .from('orchestrator_manual_tasks')
            .delete()
            .eq('run_id', runId)

          // Delete associated artifacts
          await supabaseClient
            .from('orchestrator_artifacts')
            .delete()
            .eq('run_id', runId)

          // Delete the run
          const { error } = await supabaseClient
            .from('orchestrator_runs')
            .delete()
            .eq('id', runId)

          if (error) {
            throw error
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Run deleted successfully' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }

        if (method === 'POST' && path.match(/^\/tasks\/[^\/]+\/complete$/)) {
          // Complete manual task
          const taskId = path.split('/')[2]
      
      const { data: task, error } = await supabaseClient
        .from('orchestrator_manual_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, task }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

        if (method === 'POST' && path.match(/^\/runs\/[^\/]+\/force-phase$/)) {
          // Force run a specific phase
          const runId = path.split('/')[2]
          const body = await req.json()
          const { phase } = body

          console.log(`🔧 Force running ${phase} phase for run ${runId}`)

          // Get current run
          const { data: currentRun, error: fetchError } = await supabaseClient
            .from('orchestrator_runs')
            .select('*')
            .eq('id', runId)
            .single()

          if (fetchError) {
            throw fetchError
          }

          // Generate artifacts for the specified phase
          await generatePhaseArtifacts(supabaseClient, runId, phase, currentRun.brief)

          return new Response(
            JSON.stringify({ success: true, message: `${phase} phase forced successfully` }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }

          if (method === 'GET' && path.match(/^\/runs\/[^\/]+\/artifacts$/)) {
            // Get artifacts for a specific run
            const runId = path.split('/')[2]

            const { data: artifacts, error } = await supabaseClient
              .from('orchestrator_artifacts')
              .select('*')
              .eq('run_id', runId)
              .order('created_at', { ascending: false })

            if (error) {
              throw error
            }

            return new Response(
              JSON.stringify(artifacts || []),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
              }
            )
          }

          if (method === 'POST' && path === '/process-runs') {
      // Auto-process queued and running runs
      const { data: queuedRuns, error: queuedError } = await supabaseClient
        .from('orchestrator_runs')
        .select('*')
        .eq('status', 'queued')

      const { data: runningRuns, error: runningError } = await supabaseClient
        .from('orchestrator_runs')
        .select('*')
        .eq('status', 'running')

      if (queuedError || runningError) {
        throw queuedError || runningError
      }

      const processedRuns = []
      
      // Start queued runs immediately
      for (const run of queuedRuns || []) {
        console.log(`🚀 Starting queued run ${run.id}`)
        
        const { data: updatedRun, error: updateError } = await supabaseClient
          .from('orchestrator_runs')
          .update({
            status: 'running',
            updated_at: new Date().toISOString()
          })
          .eq('id', run.id)
          .select()
          .single()

        if (!updateError) {
          processedRuns.push(updatedRun)
          console.log(`✅ Started run ${run.id} - now running in ${run.phase} phase`)
        }
      }
      
      // Process running runs
      for (const run of runningRuns || []) {
        // Simulate processing time (runs that have been running for more than 30 seconds)
        const runningTime = Date.now() - new Date(run.updated_at).getTime()
        
        if (runningTime > 30000) { // 30 seconds
          const phaseOrder = ['intake', 'market', 'synthesis', 'deconstruct', 'prioritize', 'build', 'qa', 'deploy', 'measure', 'decision']
          const currentPhaseIndex = phaseOrder.indexOf(run.phase)
          
          let nextPhase = run.phase
          let nextStatus = 'running'
          
          // Advance to next phase
          if (currentPhaseIndex < phaseOrder.length - 1) {
            nextPhase = phaseOrder[currentPhaseIndex + 1]
            
            // 30% chance of requiring human intervention in key phases
            const shouldRequireHuman = Math.random() < 0.3
            if (shouldRequireHuman && ['synthesis', 'prioritize', 'qa'].includes(nextPhase)) {
              nextStatus = 'awaiting_human'
              
              // Create a manual task
              await supabaseClient
                .from('orchestrator_manual_tasks')
                .insert({
                    run_id: run.id,
                    phase: nextPhase,
                    task_type: 'portfolio_approval',
                    status: 'open',
                    title: `Review ${nextPhase} phase results`,
                    description: `Please review the ${nextPhase} phase output and approve to continue.`,
                    assignee: 'operator'
                })
            }
          } else {
            nextStatus = 'done'
          }

          // Update the run
          const { data: updatedRun, error: updateError } = await supabaseClient
            .from('orchestrator_runs')
            .update({
              status: nextStatus,
              phase: nextPhase,
              updated_at: new Date().toISOString()
            })
            .eq('id', run.id)
            .select()
            .single()

          if (!updateError) {
            processedRuns.push(updatedRun)
            console.log(`🤖 Auto-advanced run ${run.id} from ${run.phase} to ${nextPhase} (${nextStatus})`)
          }
        }
      }

      return new Response(
        JSON.stringify({ processed: processedRuns.length, runs: processedRuns }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (method === 'GET' && path === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          path: '/orchestrator-api/health'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Route not found
    console.log('❌ Route not found:', method, path)
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
