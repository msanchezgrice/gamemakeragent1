import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper function to generate game summary for QA display
function generateGameSummary(brief: any): string {
  const theme = brief.theme || 'Unknown';
  const subgenre = brief.subgenre || brief.gameType || 'casual';
  const visualHook = brief.visualHook || 'engaging visuals';
  
  // Create a descriptive summary
  const themeAdjective = theme.toLowerCase().includes('space') ? 'cosmic' :
                        theme.toLowerCase().includes('nature') ? 'natural' :
                        theme.toLowerCase().includes('urban') ? 'urban' :
                        theme.toLowerCase().includes('underwater') ? 'aquatic' :
                        theme.toLowerCase().includes('fantasy') ? 'magical' :
                        'themed';
  
  const styleDescriptor = visualHook.toLowerCase().includes('minimalist') ? 'minimalist' :
                         visualHook.toLowerCase().includes('exploding') ? 'explosive' :
                         visualHook.toLowerCase().includes('juicy') ? 'juicy' :
                         visualHook.toLowerCase().includes('satisfying') ? 'satisfying' :
                         visualHook.toLowerCase().includes('perfect') ? 'precision' :
                         'stylized';
  
  return `${themeAdjective} ${styleDescriptor} ${subgenre.toLowerCase()}`.replace(/\s+/g, ' ').trim();
}

// Helper function to extract JSON from LLM response (removes markdown code blocks)
function extractJsonFromLLMResponse(text: string): string {
  // Safety check for undefined/null text
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided to extractJsonFromLLMResponse');
  }
  
  // Remove markdown code blocks if present
  let cleanText = text.trim();
  
  // Remove ```json and ``` markers
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '');
  }
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '');
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.replace(/\s*```$/, '');
  }
  
  // Remove any leading/trailing whitespace
  cleanText = cleanText.trim();
  
  return cleanText;
}

// Helper function for LLM API calls with timeout handling and retry logic
async function callLLMWithTimeout(model: string, messages: any[], tools?: any[], temperature?: number, timeoutMs: number = 300000, maxTokens?: number, retries: number = 3) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Set appropriate max_tokens based on model if not specified
  // These are MAX OUTPUT TOKEN limits, not context window limits
  let modelMaxTokens = maxTokens;
  if (!modelMaxTokens) {
    if (model.includes('claude-3-5-sonnet-20241022')) {
      modelMaxTokens = 8192; // Claude 3.5 Sonnet max output
    } else if (model.includes('claude-sonnet-4-20250514')) {
      modelMaxTokens = 64000; // Claude Sonnet 4 max output
    } else if (model.includes('claude-opus-4-1-20250805')) {
      modelMaxTokens = 32000; // Claude Opus 4.1 max output
    } else if (model.includes('claude-opus-4-20250514')) {
      modelMaxTokens = 32000; // Claude Opus 4 max output
    } else if (model.includes('claude-3-7-sonnet')) {
      modelMaxTokens = 64000; // Claude Sonnet 3.7 max output
    } else if (model.includes('claude-3-5-haiku')) {
      modelMaxTokens = 8192; // Claude Haiku 3.5 max output
    } else {
      modelMaxTokens = 4000; // Safe default for unknown models
    }
  }

  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestBody: any = {
        model,
        max_tokens: modelMaxTokens,
        messages
      };

      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }

      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      console.log(`🔄 LLM API attempt ${attempt + 1}/${retries} with model ${model} (${modelMaxTokens} max tokens)`);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      console.log(`✅ LLM API success on attempt ${attempt + 1}`);
      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      
      if (error.name === 'AbortError') {
        throw new Error(`LLM API timeout after ${timeoutMs/1000}s with model ${model}`);
      }
      
      // Check if it's a network/SSL error that might be retryable
      const isRetryable = error.message?.includes('HandshakeFailure') || 
                         error.message?.includes('Connect') ||
                         error.message?.includes('ECONNRESET') ||
                         error.message?.includes('ECONNREFUSED');
      
      if (!isRetryable || attempt === retries - 1) {
        console.error(`❌ LLM API failed on attempt ${attempt + 1}:`, error.message);
        throw error;
      }
      
      console.log(`⚠️ LLM API attempt ${attempt + 1} failed (retryable), waiting before retry:`, error.message);
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError;
}

// Step tracking functions
async function createOrUpdateStep(supabaseClient: any, runId: string, phase: string, status: string, input?: any, output?: any, error?: any) {
  const stepData = {
    run_id: runId,
    phase: phase,
    status: status,
    started_at: status === 'running' ? new Date().toISOString() : undefined,
    finished_at: ['done', 'failed'].includes(status) ? new Date().toISOString() : undefined,
    input: input || null,
    output: output || null,
    error: error || null,
    updated_at: new Date().toISOString()
  };

  // Try to update existing step first
  const { data: existingStep } = await supabaseClient
    .from('orchestrator_steps')
    .select('id')
    .eq('run_id', runId)
    .eq('phase', phase)
    .single();

  if (existingStep) {
    // Update existing step
    const { data, error: updateError } = await supabaseClient
      .from('orchestrator_steps')
      .update(stepData)
      .eq('id', existingStep.id)
      .select()
      .single();
    
    if (updateError) {
      console.error(`❌ Failed to update step ${phase}:`, updateError);
    }
    return data;
  } else {
    // Create new step
    const { data, error: insertError } = await supabaseClient
      .from('orchestrator_steps')
      .insert({
        ...stepData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error(`❌ Failed to create step ${phase}:`, insertError);
    }
    return data;
  }
}

// Artifact generation functions
async function generatePhaseArtifacts(supabaseClient: any, runId: string, phase: string, brief: any, forceRegeneration = false) {
  console.log(`🎨 Generating artifacts for ${phase} phase of run ${runId}`)
  
  // Check if artifacts for this phase already exist to prevent duplicates
  const { data: existingArtifacts, error: checkError } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('id, kind, created_at')
    .eq('run_id', runId)
    .eq('phase', phase)
    .order('created_at', { ascending: false })
    .limit(10);

  if (checkError) {
    console.error(`❌ Error checking existing artifacts for ${phase}:`, checkError);
  }

  if (existingArtifacts && existingArtifacts.length > 0 && !forceRegeneration) {
    console.log(`⚠️ Found ${existingArtifacts.length} existing artifacts for ${phase} phase of run ${runId}:`, existingArtifacts.map(a => a.kind).join(', '));
    console.log(`⚠️ Skipping generation - artifacts already exist for ${phase} phase (use forceRegeneration=true to override)`);
    return;
  } else if (existingArtifacts && existingArtifacts.length > 0 && forceRegeneration) {
    console.log(`🔄 Force regenerating ${existingArtifacts.length} existing artifacts for ${phase} phase`);
  }
  
  // Create/update step as running
  await createOrUpdateStep(supabaseClient, runId, phase, 'running', { brief });
  
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
    
    // Mark step as completed
    await createOrUpdateStep(supabaseClient, runId, phase, 'done', { brief }, { success: true });
    console.log(`✅ Completed ${phase} phase for run ${runId}`);
    
  } catch (error) {
    console.error(`❌ Failed to generate artifacts for ${phase}:`, error);
    // Mark step as failed
    await createOrUpdateStep(supabaseClient, runId, phase, 'failed', { brief }, null, { message: error.message });
  }
}

async function generateMarketArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🔍 Generating real market research for ${brief.theme} in ${brief.industry}`);
  
  // Enhanced LLM call to Claude with web search for real-time market research
  const marketPrompt = `You are a market research analyst for mobile games with access to real-time web search. Analyze the market for a ${brief.theme} themed game in the ${brief.industry} industry targeting ${brief.targetAudience || 'general audience'}.

Goal: ${brief.goal}

Use web search to gather current, real-time market data about:
- Recent ${brief.theme} games released in 2024-2025
- Current market trends in ${brief.industry} gaming
- Popular games similar to "${brief.theme}" theme
- User reviews and feedback on similar games
- Market performance data and download statistics

Provide a comprehensive market analysis in JSON format with:
1. Current market trends (array of strings) - based on recent search results
2. Top 5 competing games (with names, brief descriptions, and recent performance data)
3. Market insights and opportunities - informed by real-time data
4. Competitor analysis with gaps identified - based on current market state
5. Recommended features for this specific theme/industry combo
6. Estimated market size and confidence level
7. Recent market developments and emerging trends

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
    console.log(`🔑 Starting market research with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const webSearchTools = [{
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5
    }];
    
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: marketPrompt
      }],
      webSearchTools, // web search for real-time market data
      undefined, // default temperature
      300000 // 5 minute timeout
      // max_tokens will be auto-detected as 64000 for Claude Sonnet 4
    );
    const marketDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(marketDataText);
    const marketData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for market research:`, error);
    
    // Check if it's a timeout error
    const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
    console.error(`❌ Error details:`, {
      message: error.message,
      isTimeout: isTimeout,
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 30000,
      hasApiKey: !!Deno.env.get('ANTHROPIC_API_KEY')
    });
    
    // Store error in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'market',
        agent: 'market-research-agent',
        level: 'error',
        message: `Market research failed: ${error.message} | Model: claude-sonnet-4-20250514 | Max tokens: 64000`,
        thinking_trace: marketPrompt,
        llm_response: null,
        created_at: new Date().toISOString()
      });
    
    // Re-throw the error to fail the phase
    throw error;
  }
}

async function generateSynthesisArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🧠 Generating real theme synthesis for ${brief.theme} in ${brief.industry}`);
  
  // Get market data from previous phase
  const { data: marketArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'market')
    .eq('kind', 'market_scan');

  const marketData = marketArtifacts?.[0]?.meta?.data || {};
  
  // Real LLM call to Claude for theme synthesis
  const synthesisPrompt = `You are a creative game design strategist specializing in theme analysis and concept synthesis. Based on market research data, synthesize actionable insights for a ${brief.theme} themed game in the ${brief.industry} industry.

Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}
Constraints: ${JSON.stringify(brief.constraints || {})}

Market Context:
${JSON.stringify(marketData, null, 2)}

Analyze the theme's potential and provide a comprehensive synthesis in JSON format with:
1. Visual design direction and aesthetic principles
2. Core gameplay mechanics that align with the theme
3. Narrative/thematic hooks and player motivation
4. Technical implementation considerations
5. Differentiation opportunities vs competitors
6. Risk assessment and mitigation strategies
7. Success metrics and KPIs specific to this theme
8. Monetization alignment with theme

Return ONLY valid JSON with this structure:
{
  "themeAnalysis": {
    "visualDirection": {
      "primaryAesthetic": "string",
      "colorPalette": ["color1", "color2", "color3"],
      "artStyle": "string",
      "iconography": ["element1", "element2"],
      "moodKeywords": ["mood1", "mood2", "mood3"]
    },
    "coreMechanics": {
      "primaryLoop": "string",
      "inputMethods": ["input1", "input2"],
      "progressionSystem": "string",
      "difficultyScaling": "string",
      "sessionStructure": "string"
    },
    "narrativeHooks": {
      "playerMotivation": "string",
      "thematicElements": ["element1", "element2"],
      "emotionalJourney": "string",
      "contextualFraming": "string"
    },
    "technicalConsiderations": {
      "performanceRequirements": "string",
      "platformOptimizations": ["opt1", "opt2"],
      "assetRequirements": "string",
      "scalabilityFactors": ["factor1", "factor2"]
    },
    "differentiation": {
      "uniqueSellingPoints": ["usp1", "usp2", "usp3"],
      "competitorGaps": ["gap1", "gap2"],
      "innovationOpportunities": ["opp1", "opp2"],
      "themeAdvantages": ["adv1", "adv2"]
    },
    "riskAssessment": {
      "themeRisks": [{"risk": "string", "impact": "high|medium|low", "mitigation": "string"}],
      "marketRisks": [{"risk": "string", "impact": "high|medium|low", "mitigation": "string"}],
      "technicalRisks": [{"risk": "string", "impact": "high|medium|low", "mitigation": "string"}]
    },
    "successMetrics": {
      "engagementKPIs": ["kpi1", "kpi2"],
      "themeSpecificMetrics": ["metric1", "metric2"],
      "benchmarkTargets": {"metric": "target"},
      "validationCriteria": ["criteria1", "criteria2"]
    },
    "monetizationAlignment": {
      "themeCompatibleModels": ["model1", "model2"],
      "naturalPaymentPoints": ["point1", "point2"],
      "valueProposition": "string",
      "pricingStrategy": "string"
    }
  },
  "recommendations": {
    "immediate": ["rec1", "rec2", "rec3"],
    "shortTerm": ["rec1", "rec2"],
    "longTerm": ["rec1", "rec2"]
  },
  "confidence": 0.85,
  "reasoning": "Detailed explanation of analysis approach and key insights"
}`;

  try {
    console.log(`🔑 Starting theme synthesis with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
        role: 'user',
        content: synthesisPrompt
      }],
      undefined, // no tools for synthesis
      0.7, // temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(llmResult.content[0].text);
    const synthesisData = JSON.parse(cleanJson);

    // Log successful analysis
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'synthesis',
        agent: 'theme-synthesis-agent',
        level: 'info',
        message: `Theme synthesis completed for ${brief.theme}`,
        thinking_trace: synthesisPrompt,
        llm_response: llmResult.content[0].text,
        created_at: new Date().toISOString()
      });

    // Store structured synthesis data
    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'synthesis',
        kind: 'theme_synthesis',
        path: `runs/${runId}/theme_synthesis.json`,
        meta: {
          filename: 'theme_synthesis.json',
          size: JSON.stringify(synthesisData).length,
          contentType: 'application/json',
          data: synthesisData,
          llm_model: 'claude-sonnet-4-20250514',
          generated_at: new Date().toISOString()
        }
      });

    // Also create a markdown summary for human readability
    const markdownSummary = `# Theme Synthesis: ${brief.theme}

## Visual Direction
- **Primary Aesthetic**: ${synthesisData.themeAnalysis.visualDirection.primaryAesthetic}
- **Art Style**: ${synthesisData.themeAnalysis.visualDirection.artStyle}
- **Color Palette**: ${synthesisData.themeAnalysis.visualDirection.colorPalette.join(', ')}
- **Mood**: ${synthesisData.themeAnalysis.visualDirection.moodKeywords.join(', ')}

## Core Mechanics
- **Primary Loop**: ${synthesisData.themeAnalysis.coreMechanics.primaryLoop}
- **Input Methods**: ${synthesisData.themeAnalysis.coreMechanics.inputMethods.join(', ')}
- **Progression**: ${synthesisData.themeAnalysis.coreMechanics.progressionSystem}

## Key Differentiators
${synthesisData.themeAnalysis.differentiation.uniqueSellingPoints.map(usp => `- ${usp}`).join('\n')}

## Immediate Recommendations
${synthesisData.recommendations.immediate.map(rec => `- ${rec}`).join('\n')}

## Risk Mitigation
${synthesisData.themeAnalysis.riskAssessment.themeRisks.map(risk => `- **${risk.risk}** (${risk.impact}): ${risk.mitigation}`).join('\n')}

---
*Generated by ThemeSynthesisAgent v3.0 | Confidence: ${synthesisData.confidence}*`;

  await supabaseClient
    .from('orchestrator_artifacts')
    .insert({
      run_id: runId,
      phase: 'synthesis',
      kind: 'theme_analysis',
      path: `runs/${runId}/theme_analysis.md`,
      meta: {
        filename: 'theme_analysis.md',
          size: markdownSummary.length,
        contentType: 'text/markdown',
          data: markdownSummary
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for theme synthesis:`, error);
    
    // Store error in logs
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'synthesis',
        agent: 'theme-synthesis-agent',
        level: 'error',
        message: `Theme synthesis failed: ${error.message}`,
        thinking_trace: synthesisPrompt,
        llm_response: null,
        created_at: new Date().toISOString()
      });
    
    // Store error log - no fallback data
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'synthesis',
        agent: 'theme-synthesis-agent',
        level: 'error',
        message: `Theme synthesis failed: ${error.message}`,
        thinking_trace: synthesisPrompt,
        llm_response: null,
        created_at: new Date().toISOString()
      });

    // Re-throw the error to fail the phase
    throw error;
  }
}

async function generateBuildArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🔨 Generating comprehensive build artifacts for ${brief.theme}`);
  
  // Get ALL previous phase data for comprehensive context
  const { data: artifacts, error: artifactsError } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('kind, meta')
    .eq('run_id', runId)
    .in('kind', ['market_scan', 'theme_synthesis', 'priority_matrix']);

  if (artifactsError) {
    console.error('❌ Failed to fetch artifacts for build brief:', artifactsError);
  }

  const marketData = artifacts?.find(a => a.kind === 'market_scan')?.meta?.data || {};
  const themeData = artifacts?.find(a => a.kind === 'theme_synthesis')?.meta?.data || {};
  const priorityData = artifacts?.find(a => a.kind === 'priority_matrix')?.meta?.data || {};

  console.log(`🎨 Using artifacts for build brief:`, {
    market: !!marketData.trends,
    theme: !!themeData.themeAnalysis,
    priority: !!priorityData.prioritizedFeatures,
    intake: { 
      gameType: brief.gameType, 
      controlType: brief.controlType,
      subgenre: brief.subgenre,
      visualHook: brief.visualHook,
      guidingNotes: brief.guidingNotes,
      referenceGames: brief.referenceGames
    }
  });

  // Extract prioritized features and mechanics from artifacts
  const prioritizedFeatures = priorityData.prioritizedFeatures || [];
  const coreMechanics = themeData.themeAnalysis?.coreMechanics || {};
  const visualDirection = themeData.themeAnalysis?.visualDirection || {};
  const marketInsights = marketData.insights || {};

  // Generate comprehensive build brief using ALL context
  const buildBriefData = {
    projectContext: {
      originalBrief: brief,
      marketInsights: marketInsights,
      themeAnalysis: themeData.themeAnalysis,
      prioritizedFeatures: prioritizedFeatures,
      // Include new intake form fields
      gameDesignInputs: {
        subgenre: brief.subgenre,
        visualHook: brief.visualHook,
        guidingNotes: brief.guidingNotes,
        referenceGames: brief.referenceGames
      }
    },
    technicalSpecs: {
      engine: "HTML5 Canvas",
      targetResolution: "360x640",
      maxFileSize: "2MB",
      performanceTargets: { fps: 60, loadTime: 1.5, memoryUsage: "50MB" },
      compatibility: ["iOS Safari", "Android Chrome"],
      gameSDKIntegration: {
        postMessageEvents: ["game:ready", "game:start", "game:end", "game:progress"],
        telemetryPoints: ["session_start", "level_complete", "game_over"],
        sessionManagement: "Standard GameTok session lifecycle"
      }
    },
    gameDesign: {
      coreLoop: coreMechanics.primaryLoop || `${brief.theme} based gameplay with ${brief.goal} integration`,
      inputMethods: brief.controlType ? [brief.controlType.toLowerCase()] : coreMechanics.inputMethods || ["tap", "swipe", "drag"],
      gameType: brief.gameType || 'casual',
      controlType: brief.controlType || 'touch',
      subgenre: brief.subgenre || 'casual',
      visualHook: brief.visualHook || 'engaging visuals',
      progressionSystem: coreMechanics.progressionSystem || "Score-based with level progression",
      sessionStructure: { 
        targetDuration: coreMechanics.sessionLength || 90, 
        phases: ["intro", "gameplay", "results"],
        endConditions: ["time_limit", "score_target", "user_quit"]
      },
      mechanics: {
        primary: coreMechanics.primaryMechanic || 'tap-based',
        secondary: coreMechanics.secondaryMechanics || [],
        difficulty: coreMechanics.difficultyProgression || 'gradual'
      }
    },
    visualDesign: {
      artStyle: visualDirection.artStyle || (brief.industry === 'education' ? 'Friendly cartoon' : 'Modern minimalist'),
      colorPalette: visualDirection.colorPalette || (brief.theme.includes('space') ? ['#001122', '#4CAF50', '#2196F3'] : ['#667eea', '#764ba2', '#4CAF50']),
      uiFramework: "Custom HTML5",
      animations: visualDirection.animations || ["smooth_transitions", "particle_effects"],
      effects: visualDirection.effects || ["score_popup", "collision_feedback"],
      theme: visualDirection.themeElements || {}
    },
    featureImplementation: prioritizedFeatures.map(feature => ({
      name: feature.name || feature,
      priority: feature.priority || 'medium',
      implementation: feature.implementation || 'standard',
      effort: feature.effort || 'medium'
    }))
  };

  // Store build brief
  await supabaseClient
    .from('orchestrator_artifacts')
    .insert({
      run_id: runId,
      phase: 'build',
      kind: 'build_brief',
      path: `runs/${runId}/build_brief.json`,
      meta: {
        filename: 'build_brief.json',
        size: JSON.stringify(buildBriefData).length,
        contentType: 'application/json',
        data: buildBriefData,
        generated_at: new Date().toISOString()
      }
    });

  // Generate playable prototype
  await generateGamePrototype(supabaseClient, runId, brief, buildBriefData);
}

function getThemeConfig(theme: string, goal: string) {
  const themeKey = theme.toLowerCase();
  
  if (themeKey.includes('temple') || themeKey.includes('runner')) {
    return {
      mechanics: 'running and dodging obstacles',
      objects: ['temple pillars', 'ancient coins', 'stone blocks'],
      colors: ['#8B4513', '#DAA520', '#CD853F'],
      instructions: 'Tap to jump over obstacles and collect coins'
    };
  } else if (themeKey.includes('space') || themeKey.includes('cosmic')) {
    return {
      mechanics: 'navigating through space and collecting items',
      objects: ['stars', 'planets', 'asteroids', 'space gems'],
      colors: ['#000080', '#4169E1', '#FFD700'],
      instructions: 'Tap to navigate and collect cosmic items'
    };
  } else if (themeKey.includes('underwater') || themeKey.includes('ocean')) {
    return {
      mechanics: 'swimming and collecting sea treasures',
      objects: ['fish', 'coral', 'pearls', 'seaweed'],
      colors: ['#008B8B', '#20B2AA', '#87CEEB'],
      instructions: 'Tap to swim and collect ocean treasures'
    };
  } else if (themeKey.includes('city') || themeKey.includes('urban')) {
    return {
      mechanics: 'building and managing city elements',
      objects: ['buildings', 'roads', 'parks', 'vehicles'],
      colors: ['#696969', '#4682B4', '#32CD32'],
      instructions: 'Tap to place and manage city elements'
    };
  } else if (themeKey.includes('racing') || themeKey.includes('speed')) {
    return {
      mechanics: 'racing and avoiding obstacles',
      objects: ['cars', 'road barriers', 'speed boosts', 'checkpoints'],
      colors: ['#FF4500', '#FFD700', '#32CD32'],
      instructions: 'Tap to steer and avoid obstacles'
    };
  } else if (themeKey.includes('puzzle') || themeKey.includes('match')) {
    return {
      mechanics: 'matching and solving puzzles',
      objects: ['puzzle pieces', 'gems', 'tiles', 'patterns'],
      colors: ['#9370DB', '#FF69B4', '#00CED1'],
      instructions: 'Tap to match and solve puzzles'
    };
  } else {
    // Generic theme-based fallback
    return {
      mechanics: `${theme.toLowerCase()} themed gameplay`,
      objects: [`${theme.toLowerCase()} elements`, 'collectibles', 'obstacles'],
      colors: ['#4CAF50', '#2196F3', '#FF5722'],
      instructions: `Tap to play ${theme.toLowerCase()} game`
    };
  }
}

async function generateGamePrototype(supabaseClient: any, runId: string, brief: any, buildBrief: any) {
  console.log(`🎮 Generating playable prototype for ${brief.theme}`);
  
  // Get artifacts from previous phases to inform game design
  const { data: artifacts, error: artifactsError } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('kind, meta')
    .eq('run_id', runId)
    .in('kind', ['market_scan', 'theme_synthesis', 'priority_matrix']);

  if (artifactsError) {
    console.error('❌ Failed to fetch artifacts for game generation:', artifactsError);
  }

  const marketData = artifacts?.find(a => a.kind === 'market_scan')?.meta?.data || {};
  const themeData = artifacts?.find(a => a.kind === 'theme_synthesis')?.meta?.data || {};
  const priorityData = artifacts?.find(a => a.kind === 'priority_matrix')?.meta?.data || {};

  console.log(`🎨 Using artifacts for game generation:`, {
    market: !!marketData.trends,
    theme: !!themeData.themeAnalysis,
    priority: !!priorityData.prioritizedFeatures
  });

  // Generate unique game using LLM with artifact data
  const gameGenerationPrompt = `You are a senior HTML5 game developer. Create a unique, playable HTML5 game based on the following specifications:

GAME BRIEF:
- Theme: ${brief.theme}
- Goal: ${brief.goal}
- Industry: ${brief.industry}
- Target Audience: ${brief.targetAudience}
- Game Type: ${brief.gameType || 'casual'}
- Control Type: ${brief.controlType || 'touch'}
- Subgenre: ${brief.subgenre || 'casual'}
- Visual Hook: ${brief.visualHook || 'engaging visuals'}
- Guiding Notes: ${brief.guidingNotes || 'None provided'}
- Reference Games: ${brief.referenceGames?.join(', ') || 'None provided'}

MARKET RESEARCH:
${JSON.stringify(marketData.insights || {}, null, 2)}

THEME ANALYSIS:
- Core Mechanics: ${themeData.themeAnalysis?.coreMechanics?.primaryLoop || 'Tap-based interaction'}
- Visual Style: ${themeData.themeAnalysis?.visualDirection?.artStyle || 'Modern minimalist'}
- Color Palette: ${themeData.themeAnalysis?.visualDirection?.colorPalette?.join(', ') || '#4CAF50, #2196F3, #FF5722'}
- Input Methods: ${themeData.themeAnalysis?.coreMechanics?.inputMethods?.join(', ') || 'tap, swipe'}

PRIORITIZED FEATURES:
${priorityData.prioritizedFeatures?.map(f => `- ${f.name || f}: ${f.priority || 'medium'} priority`).join('\n') || '- Core gameplay mechanics\n- Score system\n- Mobile optimization'}

BUILD BRIEF CONTEXT:
${JSON.stringify(buildBrief, null, 2)}

CRITICAL REQUIREMENTS:
1. Create a UNIQUE game that matches the theme and mechanics from the analysis
2. Design gameplay mechanics that are SPECIFICALLY tailored to the theme (${brief.theme})
3. Use HTML5 Canvas with mobile-first design (360x640)
4. Include proper GameTok SDK integration via postMessage
5. Make it actually playable with theme-appropriate mechanics and visuals
6. Use the specified color palette and visual style from theme analysis
7. Implement the core mechanics and input methods from the theme analysis
8. Create game objects, interactions, and goals that relate directly to the theme
9. Ensure proper HTML formatting - NO markdown code blocks, NO backticks
10. Return clean, properly formatted HTML that can be directly executed

THEME-SPECIFIC DESIGN REQUIREMENTS:
- If theme is "Temple runner": Create running/dodging mechanics with temple aesthetics
- If theme is "Space exploration": Create navigation/discovery mechanics with cosmic visuals
- If theme is "Underwater adventure": Create swimming/collecting mechanics with ocean life
- If theme is "City building": Create placement/management mechanics with urban elements
- If theme is "Racing": Create speed/timing mechanics with vehicles and tracks
- If theme is "Puzzle": Create logic/matching mechanics with themed puzzle pieces
- Always adapt the core gameplay loop to match the theme's natural interactions

FORMATTING REQUIREMENTS:
- Return ONLY the HTML content
- NO markdown formatting (no \`\`\`html or \`\`\`)
- NO explanatory text before or after the HTML
- Ensure proper HTML structure with DOCTYPE, head, body
- All CSS and JavaScript should be embedded within the HTML

Return a complete, properly formatted HTML file that creates a unique game based on the theme analysis and prioritized features.`;

  let gameHTML = '';
  
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 30000,
        messages: [
          {
            role: 'user',
            content: gameGenerationPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API failed: ${response.status}`);
    }

    const result = await response.json();
    let rawHTML = result.content[0].text;
    
    // Clean up the HTML to prevent formatting issues
    gameHTML = rawHTML
      .replace(/^```html\s*/i, '') // Remove opening markdown
      .replace(/\s*```\s*$/i, '') // Remove closing markdown
      .replace(/^Here's.*?:\s*/i, '') // Remove explanatory text
      .replace(/^```\s*/i, '') // Remove any remaining markdown
      .trim();
    
    // Ensure it starts with DOCTYPE
    if (!gameHTML.toLowerCase().startsWith('<!doctype')) {
      console.warn('⚠️ Generated HTML missing DOCTYPE, adding fallback structure');
      gameHTML = `<!DOCTYPE html>\n${gameHTML}`;
    }

    console.log(`✅ Generated unique game prototype for ${brief.theme} (${gameHTML.length} bytes)`);

  } catch (error) {
    console.error('❌ Failed to generate game with LLM, using fallback:', error);
    
    // Create theme-specific fallback based on the theme
    const themeConfig = getThemeConfig(brief.theme, brief.goal);
    gameHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brief.theme} - ${brief.goal}</title>
    <style>
        body { margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        #gameContainer { width: 360px; height: 640px; background: #000; border-radius: 10px; overflow: hidden; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        #gameCanvas { width: 100%; height: 100%; display: block; }
        .score { position: absolute; top: 20px; left: 20px; color: white; font-size: 24px; font-weight: bold; pointer-events: none; z-index: 5; }
        .start-screen { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; z-index: 20; }
        .start-button { background: #4CAF50; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 25px; cursor: pointer; margin-top: 20px; }
        .game-over { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: none; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; z-index: 20; }
        .restart-button { background: #2196F3; color: white; border: none; padding: 15px 30px; font-size: 18px; border-radius: 25px; cursor: pointer; margin-top: 20px; }
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="360" height="640"></canvas>
        <div class="score" id="scoreDisplay">Score: 0</div>
        <div class="start-screen" id="startScreen">
            <h1>${brief.theme}</h1>
            <p>${brief.goal}</p>
            <p>${themeConfig.instructions}</p>
            <button class="start-button" onclick="startGame()">Start Game</button>
        </div>
        <div class="game-over" id="gameOverScreen">
            <h2>Game Over!</h2>
            <p id="finalScore">Final Score: 0</p>
            <button class="restart-button" onclick="restartGame()">Play Again</button>
        </div>
    </div>
    <script>
        let gameSession = { id: 'session_' + Date.now(), gameId: '${runId}', startTime: null, score: 0, isActive: false };
        function postToParent(message) { if (window.parent !== window) { window.parent.postMessage(message, '*'); } }
        let canvas, ctx, gameState = 'start', score = 0, gameObjects = [], lastTime = 0, animationId;
        class GameObject { constructor(x, y, size, color, speed) { this.x = x; this.y = y; this.size = size; this.color = color; this.speed = speed; } update(deltaTime) { this.y += this.speed * deltaTime; } draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size); } isOffScreen() { return this.y > canvas.height + this.size; } }
        let player = { x: 180, y: 500, size: 30, color: '#4CAF50', speed: 300 };
        function init() { canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d'); canvas.addEventListener('touchstart', handleInput, { passive: false }); canvas.addEventListener('touchmove', handleInput, { passive: false }); canvas.addEventListener('mousedown', handleInput); canvas.addEventListener('mousemove', handleInput); postToParent({ type: 'game:ready' }); }
        function handleInput(e) { e.preventDefault(); if (gameState !== 'playing') return; let rect = canvas.getBoundingClientRect(); let clientX = e.touches ? e.touches[0].clientX : e.clientX; let x = (clientX - rect.left) * (canvas.width / rect.width); player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, x)); }
        function startGame() { gameState = 'playing'; score = 0; gameObjects = []; gameSession.startTime = Date.now(); gameSession.isActive = true; document.getElementById('startScreen').style.display = 'none'; document.getElementById('gameOverScreen').style.display = 'none'; postToParent({ type: 'game:start', gameId: gameSession.gameId, sessionId: gameSession.id }); gameLoop(0); }
        function restartGame() { startGame(); }
        function endGame() { gameState = 'gameOver'; gameSession.isActive = false; document.getElementById('finalScore').textContent = 'Final Score: ' + score; document.getElementById('gameOverScreen').style.display = 'flex'; if (animationId) { cancelAnimationFrame(animationId); } postToParent({ type: 'game:end', gameId: gameSession.gameId, sessionId: gameSession.id, reason: 'completed', seconds: (Date.now() - gameSession.startTime) / 1000, score: score }); }
        function gameLoop(currentTime) { if (gameState !== 'playing') return; let deltaTime = (currentTime - lastTime) / 1000; lastTime = currentTime; if (Math.random() < 0.02) { gameObjects.push(new GameObject(Math.random() * canvas.width, -20, 20 + Math.random() * 20, \`hsl(\${Math.random() * 360}, 70%, 50%)\`, 100 + Math.random() * 200)); } for (let i = gameObjects.length - 1; i >= 0; i--) { gameObjects[i].update(deltaTime); let dx = gameObjects[i].x - player.x; let dy = gameObjects[i].y - player.y; let distance = Math.sqrt(dx * dx + dy * dy); if (distance < (gameObjects[i].size + player.size) / 2) { score += 10; gameObjects.splice(i, 1); continue; } if (gameObjects[i].isOffScreen()) { gameObjects.splice(i, 1); } } let gameTime = (Date.now() - gameSession.startTime) / 1000; if (gameTime > 60 || score >= 500) { endGame(); return; } draw(); document.getElementById('scoreDisplay').textContent = 'Score: ' + score; if (Math.floor(gameTime) % 5 === 0) { postToParent({ type: 'game:progress', gameId: gameSession.gameId, sessionId: gameSession.id, seconds: gameTime, score: score }); } animationId = requestAnimationFrame(gameLoop); }
        function draw() { ctx.fillStyle = '#001122'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let i = 0; i < 50; i++) { ctx.fillStyle = 'white'; ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1); } ctx.fillStyle = player.color; ctx.fillRect(player.x - player.size/2, player.y - player.size/2, player.size, player.size); gameObjects.forEach(obj => obj.draw()); }
        window.addEventListener('load', init);
        window.addEventListener('message', function(event) { switch(event.data.type) { case 'host:pause': if (animationId) cancelAnimationFrame(animationId); break; case 'host:resume': if (gameState === 'playing') gameLoop(performance.now()); break; case 'host:end': endGame(); break; } });
    </script>
</body>
</html>`;
  }

  // Store the playable prototype
  await supabaseClient
    .from('orchestrator_artifacts')
    .insert({
      run_id: runId,
      phase: 'build',
      kind: 'game_prototype',
      path: `runs/${runId}/prototype.html`,
      meta: {
        filename: 'prototype.html',
        size: gameHTML.length,
        contentType: 'text/html',
        data: gameHTML,
        playable: 'true',
        gameSDKCompliant: 'true',
        generated_at: new Date().toISOString(),
        specifications: {
          engine: 'HTML5 Canvas',
          resolution: '360x640',
          fileSize: Math.round(gameHTML.length / 1024) + 'KB',
          features: ['touch_controls', 'scoring', 'session_tracking', 'gametok_integration']
        },
        llm_model: 'claude-opus-4-1-20250805'
      }
    });

  console.log(`✅ Generated playable prototype (${Math.round(gameHTML.length / 1024)}KB)`);
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
    console.log(`🔑 Starting intake processing with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: intakePrompt
      }],
      undefined, // no tools for intake
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const intakeDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(intakeDataText);
    const intakeData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error(`❌ LLM call failed for intake processing:`, error);
    
    // Store error log - no fallback data
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'intake',
        agent: 'intake-specialist',
        level: 'error',
        message: `Intake processing failed: ${error.message}`,
        thinking_trace: intakePrompt,
        llm_response: null,
        created_at: new Date().toISOString()
      });

    // Re-throw the error to fail the phase
    throw error;
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
    console.log(`🔑 Starting deconstruct analysis with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: deconstructPrompt
      }],
      undefined, // no tools for deconstruct
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const deconstructDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(deconstructDataText);
    const deconstructData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
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
  console.log(`🎯 Generating comprehensive prioritization for ${brief.theme}`);
  
  // Get previous phase data
  const { data: marketArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'market')
    .eq('kind', 'market_scan');

  const { data: synthesisArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'synthesis')
    .eq('kind', 'theme_synthesis');

  const { data: deconstructArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'deconstruct')
    .eq('kind', 'deconstruct_analysis');

  const marketData = marketArtifacts?.[0]?.meta?.data || {};
  const synthesisData = synthesisArtifacts?.[0]?.meta?.data || {};
  const deconstructData = deconstructArtifacts?.[0]?.meta?.data || {};
  
  // Enhanced LLM call to Claude for HTML5 hyper-casual game feature prioritization
  const prioritizePrompt = `You are a senior HTML5 hyper-casual game designer specializing in feature prioritization for web-based mini games. Based on comprehensive market research, theme synthesis, and competitive analysis, create a detailed ranked feature list for an HTML5 hyper-casual mini game.

GAME CONTEXT:
Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}
Game Type: ${brief.gameType || 'hyper-casual'}
Control Type: ${brief.controlType || 'touch'}
Tech Stack: HTML5 Canvas, JavaScript, Mobile-first responsive design
Platform: Web browsers (mobile and desktop)
Session Length: 30-120 seconds
Monetization: None (focus on engagement and fun)

MARKET RESEARCH DATA:
${JSON.stringify(marketData, null, 2)}

THEME SYNTHESIS DATA:
${JSON.stringify(synthesisData, null, 2)}

COMPETITIVE ANALYSIS:
${JSON.stringify(deconstructData, null, 2)}

Create a prioritized feature list specifically for HTML5 hyper-casual game development. Focus on:
1. Core gameplay mechanics ranked by importance
2. Visual and audio features that enhance the theme
3. User interface elements for optimal mobile experience
4. Technical features for smooth HTML5 performance
5. Engagement features for replay value
6. Accessibility features for broader reach

Return ONLY valid JSON with this structure:
{
  "prioritizedFeatures": [
    {
      "name": "Feature Name",
      "description": "Feature description",
      "category": "core-mechanic|visual|ui|technical|engagement|accessibility",
      "priority": "critical|high|medium|low",
      "implementation": "simple|moderate|complex",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "themeRelevance": 0.0-1.0,
      "mobileOptimized": true/false,
      "dependencies": ["dependency1", "dependency2", ...]
    }
  ],
  "coreGameplayMechanics": [
    {
      "mechanic": "Primary game mechanic name",
      "description": "How this mechanic works",
      "inputMethod": "tap|swipe|drag|tilt|multi-touch",
      "complexity": "simple|moderate|complex",
      "themeAlignment": "How this aligns with the theme"
    }
  ],
  "visualFeatures": [
    {
      "feature": "Visual feature name",
      "purpose": "Why this visual feature is important",
      "implementation": "HTML5 Canvas technique or CSS approach",
      "priority": "critical|high|medium|low"
    }
  ],
  "technicalRequirements": [
    {
      "requirement": "Technical requirement",
      "reason": "Why this is needed for HTML5 hyper-casual games",
      "implementation": "How to implement this",
      "priority": "critical|high|medium|low"
    }
  ],
  "mobileOptimizations": [
    {
      "optimization": "Mobile-specific optimization",
      "benefit": "How this improves mobile experience",
      "implementation": "Technical approach",
      "priority": "critical|high|medium|low"
    }
  ],
  "engagementFeatures": [
    {
      "feature": "Engagement feature name",
      "purpose": "How this increases replay value",
      "implementation": "How to implement",
      "priority": "critical|high|medium|low"
    }
  ],
  "developmentPhases": {
    "phase1_core": {
      "features": ["Essential features for basic gameplay"],
      "description": "Core mechanics and basic visuals",
      "estimatedHours": "Development time estimate"
    },
    "phase2_polish": {
      "features": ["Polish and enhancement features"],
      "description": "Visual improvements and UX enhancements",
      "estimatedHours": "Development time estimate"
    },
    "phase3_engagement": {
      "features": ["Features that increase replay value"],
      "description": "Additional mechanics and content",
      "estimatedHours": "Development time estimate"
    }
  },
  "recommendations": "Specific recommendations for HTML5 hyper-casual game development based on the theme and analysis"
}`;

  try {
    console.log(`🔑 Starting prioritization analysis with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: prioritizePrompt
      }],
      undefined, // no tools for prioritize
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const prioritizeDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(prioritizeDataText);
    const prioritizeData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
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
  
  // First, check if there's a completed prototype from build phase
  const { data: prototypeArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'build')
    .eq('kind', 'game_prototype');

  if (!prototypeArtifacts || prototypeArtifacts.length === 0) {
    throw new Error('No completed prototype found. QA phase requires a playable prototype from build phase.');
  }

  const prototype = prototypeArtifacts[0];
  console.log(`✅ Found prototype: ${prototype.meta.filename} (${prototype.meta.specifications?.fileSize})`);

  // Get build brief for context
  const { data: buildArtifacts } = await supabaseClient
    .from('orchestrator_artifacts')
    .select('meta')
    .eq('run_id', runId)
    .eq('phase', 'build')
    .eq('kind', 'build_brief');

  const buildBrief = buildArtifacts?.[0]?.meta?.data || {};
  
  // Enhanced QA prompt that includes prototype analysis
  const qaPrompt = `You are a senior QA specialist for mobile game testing. You have a completed prototype to test for a ${brief.theme} game in the ${brief.industry} industry.

GAME CONTEXT:
Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Goal: ${brief.goal}
Subgenre: ${brief.subgenre || 'casual'}
Visual Hook: ${brief.visualHook || 'engaging visuals'}

PROTOTYPE SPECIFICATIONS:
Engine: HTML5 Canvas
Target Resolution: 360x640
File Size: ${prototype.meta.specifications?.fileSize || 'Unknown'}
Features: ${prototype.meta.specifications?.features?.join(', ') || 'Standard game features'}

BUILD BRIEF SUMMARY:
Core Loop: ${buildBrief.gameDesign?.coreLoop || 'Standard gameplay loop'}
Input Methods: ${buildBrief.gameDesign?.inputMethods?.join(', ') || 'touch controls'}
Visual Style: ${buildBrief.visualDesign?.artStyle || 'modern minimalist'}

Create a comprehensive QA testing plan specifically for this completed prototype. Focus on:

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
    console.log(`🔑 Starting QA strategy generation with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: qaPrompt
      }],
      undefined, // no tools for QA strategy
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const qaDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(qaDataText);
    const qaData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
          generated_at: new Date().toISOString()
        }
      });

    // Now perform automated code analysis and bug detection
    await generateQACodeAnalysis(supabaseClient, runId, brief, prototype);

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

async function generateQACodeAnalysis(supabaseClient: any, runId: string, brief: any, prototype: any) {
  console.log(`🔍 Performing automated code analysis for ${brief.theme}`);
  
  const prototypeCode = prototype.meta.data;
  const gameSpecs = prototype.meta.specifications || {};
  
  // Create a temporary hosted URL for the game (for web browsing agents)
  const gameUrl = `data:text/html;base64,${btoa(prototypeCode)}`;
  
  // Enhanced QA code analysis prompt with text editor and web browser tools
  const codeAnalysisPrompt = `You are a senior QA engineer specializing in HTML5 game testing and code analysis. You have access to text editor and web search tools for comprehensive testing.

TESTING APPROACH:
1. **TEXT EDITOR ANALYSIS**: Use the text editor tool to create and analyze the game code file
2. **WEB BROWSER TESTING**: Use web search to look up best practices and testing methodologies
3. **CODE REVIEW**: Systematically examine HTML, CSS, and JavaScript for bugs
4. **GAMEPLAY SIMULATION**: Actually test the game by analyzing its behavior patterns
5. **MOBILE TESTING**: Analyze touch controls and mobile compatibility
6. **PERFORMANCE REVIEW**: Check for optimization opportunities

INSTRUCTIONS:
1. First, use the text editor tool to create a file called "game_prototype.html" with the provided code
2. Use web search to research current HTML5 game testing best practices if needed
3. Analyze the code structure, game logic, and potential issues
4. Simulate actual gameplay by following the game's event flow and logic
5. Provide comprehensive QA analysis based on your examination

GAME TO TEST:
Game URL (for reference): ${gameUrl}
Theme: ${brief.theme}
Industry: ${brief.industry}
Target Audience: ${brief.targetAudience || 'General'}
Game Type: ${(brief as any).gameType || 'Unknown'}
Control Type: ${(brief as any).controlType || 'Unknown'}

GAME SPECIFICATIONS:
${JSON.stringify(gameSpecs, null, 2)}

PROTOTYPE CODE TO ANALYZE:
\`\`\`html
${prototypeCode}
\`\`\`

COMPREHENSIVE QA ANALYSIS REQUIRED:

**STEP 1: CODE REVIEW**
- Analyze the HTML, CSS, and JavaScript for bugs
- Check game logic, event handling, and state management
- Review performance optimizations and mobile compatibility

**STEP 2: GAMEPLAY SIMULATION**
- Mentally simulate the game flow based on the code
- Identify potential gameplay issues and user experience problems
- Check if the game matches the theme and brief requirements

**STEP 3: MOBILE TESTING SIMULATION**
- Analyze touch event handling and mobile responsiveness
- Check for proper preventDefault calls and gesture support
- Verify mobile-first design implementation

**STEP 4: BUG IDENTIFICATION**
Identify specific bugs with:
- Exact location in code (line numbers if possible)
- Severity level (Critical/High/Medium/Low)
- Impact on gameplay and user experience
- Recommended fixes with code examples

**STEP 5: GAMEPLAY VALIDATION**
Based on code analysis, determine if:
- Game mechanics work as intended
- Theme is properly implemented
- Controls are responsive and intuitive
- Game is actually playable and engaging

**STEP 6: WEB BROWSING SIMULATION**
Simulate actually playing the game by:
- Following the game flow from start screen to gameplay
- Testing touch interactions and controls
- Checking if animations and transitions work smoothly
- Verifying score tracking and game over conditions
- Testing mobile responsiveness and orientation

**STEP 7: COMPREHENSIVE BUG REPORT**
Provide detailed analysis covering:

1. **FUNCTIONAL BUGS**: Logic errors, broken game mechanics, incorrect implementations
2. **PERFORMANCE ISSUES**: Memory leaks, inefficient algorithms, rendering bottlenecks
3. **MOBILE COMPATIBILITY**: Touch handling, responsive design, device-specific issues
4. **SECURITY CONCERNS**: XSS vulnerabilities, unsafe practices
5. **USER EXPERIENCE PROBLEMS**: Poor controls, confusing UI, accessibility issues
6. **CODE QUALITY ISSUES**: Poor structure, missing error handling, maintainability concerns

For each issue found, provide:
- Severity level (Critical/High/Medium/Low)
- Specific location in code (line numbers if possible)
- Detailed description of the problem
- Potential impact on users
- Recommended fix or improvement
- Testing steps to reproduce

Return ONLY valid JSON with this structure:
{
  "analysisMetadata": {
    "codeSize": "size in KB",
    "complexity": "Low|Medium|High",
    "overallQuality": "Poor|Fair|Good|Excellent",
    "testability": "Poor|Fair|Good|Excellent",
    "maintainability": "Poor|Fair|Good|Excellent"
  },
  "bugReport": [
    {
      "id": "unique_bug_id",
      "severity": "Critical|High|Medium|Low",
      "category": "Functional|Performance|Mobile|Security|UX|Code Quality",
      "title": "Brief bug title",
      "description": "Detailed description of the issue",
      "location": "Code location or component affected",
      "impact": "Impact on user experience or functionality",
      "reproductionSteps": ["step1", "step2", "step3"],
      "recommendedFix": "Specific fix recommendation",
      "estimatedEffort": "Low|Medium|High"
    }
  ],
  "performanceAnalysis": {
    "renderingEfficiency": "assessment of rendering performance",
    "memoryUsage": "memory usage analysis",
    "eventHandling": "event handling efficiency",
    "gameLoopOptimization": "game loop performance analysis"
  },
  "mobileCompatibility": {
    "touchHandling": "touch input analysis",
    "responsiveDesign": "responsive design assessment",
    "deviceCompatibility": "device compatibility analysis",
    "orientationSupport": "orientation handling analysis"
  },
  "securityAssessment": {
    "xssVulnerabilities": "XSS vulnerability analysis",
    "inputValidation": "input validation assessment",
    "dataHandling": "data handling security analysis"
  },
  "recommendations": {
    "immediate": ["critical fixes needed immediately"],
    "shortTerm": ["improvements for next iteration"],
    "longTerm": ["architectural improvements for future versions"]
  },
  "testingRecommendations": {
    "automatedTests": ["suggested automated test cases"],
    "manualTests": ["manual testing scenarios"],
    "deviceTesting": ["specific devices/browsers to test"]
  },
  "qualityScore": {
    "overall": "0-100 quality score",
    "functional": "0-100 functional quality",
    "performance": "0-100 performance score",
    "maintainability": "0-100 maintainability score"
  }
}`;

  try {
    console.log(`🔑 Starting QA code analysis with Claude Sonnet 4 and web browser tools...`);
    
    // Make LLM API call for code analysis using helper with retry logic
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: codeAnalysisPrompt }],
      [
        {
          type: 'text_editor_20241022',
          name: 'text_editor'
        },
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3
        }
      ],
      0.1, // Lower temperature for more focused analysis
      300000, // 5 minute timeout for comprehensive analysis
      30000
    );

    const analysisText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(analysisText);
    const analysisData = JSON.parse(cleanJson);
    
    console.log(`✅ Generated code analysis with ${analysisData.bugReport?.length || 0} issues found`);

    // Store analysis log
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'qa',
        agent: 'qa-code-analyzer',
        level: 'info',
        message: `Code analysis completed: ${analysisData.bugReport?.length || 0} issues found, quality score: ${analysisData.qualityScore?.overall || 'N/A'}`,
        thinking_trace: codeAnalysisPrompt,
        llm_response: analysisText,
        created_at: new Date().toISOString()
      });

    // Store code analysis artifact
    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'qa',
        kind: 'code_analysis',
        path: `runs/${runId}/code_analysis.json`,
        meta: {
          filename: 'code_analysis.json',
          size: JSON.stringify(analysisData).length,
          contentType: 'application/json',
          data: analysisData,
          llm_model: 'claude-sonnet-4-20250514',
          generated_at: new Date().toISOString(),
          bugsFound: analysisData.bugReport?.length || 0,
          qualityScore: analysisData.qualityScore?.overall || 0
        }
      });

  } catch (error) {
    console.error(`❌ Code analysis failed:`, error);
    
    // Fallback analysis
    const fallbackAnalysis = {
      analysisMetadata: {
        codeSize: `${Math.round((prototypeCode?.length || 0) / 1024)}KB`,
        complexity: "Medium",
        overallQuality: "Fair",
        testability: "Fair",
        maintainability: "Fair"
      },
      bugReport: [
        {
          id: "fallback_001",
          severity: "Medium",
          category: "Code Quality",
          title: "Automated analysis unavailable",
          description: "Code analysis could not be completed automatically. Manual review recommended.",
          location: "Entire codebase",
          impact: "Unknown potential issues may exist",
          reproductionSteps: ["Manual code review required"],
          recommendedFix: "Perform manual code review and testing",
          estimatedEffort: "Medium"
        }
      ],
      performanceAnalysis: {
        renderingEfficiency: "Requires manual assessment",
        memoryUsage: "Requires profiling",
        eventHandling: "Requires testing",
        gameLoopOptimization: "Requires performance analysis"
      },
      mobileCompatibility: {
        touchHandling: "Requires device testing",
        responsiveDesign: "Requires multi-device testing",
        deviceCompatibility: "Requires compatibility testing",
        orientationSupport: "Requires orientation testing"
      },
      securityAssessment: {
        xssVulnerabilities: "Requires security audit",
        inputValidation: "Requires validation testing",
        dataHandling: "Requires security review"
      },
      recommendations: {
        immediate: ["Perform manual code review", "Test on target devices"],
        shortTerm: ["Set up automated testing", "Performance profiling"],
        longTerm: ["Implement comprehensive QA pipeline"]
      },
      testingRecommendations: {
        automatedTests: ["Unit tests for game logic", "Performance benchmarks"],
        manualTests: ["Device compatibility testing", "User experience testing"],
        deviceTesting: ["iOS Safari", "Android Chrome", "Various screen sizes"]
      },
      qualityScore: {
        overall: "75",
        functional: "75",
        performance: "75",
        maintainability: "75"
      }
    };

    // Store fallback analysis
    await supabaseClient
      .from('orchestrator_logs')
      .insert({
        run_id: runId,
        phase: 'qa',
        agent: 'qa-code-analyzer',
        level: 'error',
        message: `Code analysis failed, using fallback: ${error.message}`,
        thinking_trace: codeAnalysisPrompt,
        llm_response: JSON.stringify(fallbackAnalysis),
        created_at: new Date().toISOString()
      });

    await supabaseClient
      .from('orchestrator_artifacts')
      .insert({
        run_id: runId,
        phase: 'qa',
        kind: 'code_analysis',
        path: `runs/${runId}/code_analysis.json`,
        meta: {
          filename: 'code_analysis.json',
          size: JSON.stringify(fallbackAnalysis).length,
          contentType: 'application/json',
          data: fallbackAnalysis,
          fallback: true,
          error: error.message,
          bugsFound: 1,
          qualityScore: 75
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
    console.log(`🔑 Starting deployment strategy with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: deployPrompt
      }],
      undefined, // no tools for deploy
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const deployDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(deployDataText);
    const deployData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
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
    console.log(`🔑 Starting measurement strategy with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: measurePrompt
      }],
      undefined, // no tools for measure
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const measureDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(measureDataText);
    const measureData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
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
    console.log(`🔑 Starting strategic decision analysis with Claude Sonnet 4 (64k output tokens)...`);
    
    // Use helper function with timeout handling - Claude Sonnet 4 for better performance and higher token limits
    const llmResult = await callLLMWithTimeout(
      'claude-sonnet-4-20250514',
      [{
          role: 'user',
          content: decisionPrompt
      }],
      undefined, // no tools for decision
      undefined, // default temperature
      300000, // 5 minute timeout
      30000 // explicit max_tokens
    );
    const decisionDataText = llmResult.content[0].text;
    
    // Extract clean JSON and parse
    const cleanJson = extractJsonFromLLMResponse(decisionDataText);
    const decisionData = JSON.parse(cleanJson);
    
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
          llm_model: 'claude-sonnet-4-20250514',
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
      // List all runs with prototype information
      const { data: runs, error } = await supabaseClient
        .from('orchestrator_runs')
        .select(`
          *,
          blockers:orchestrator_manual_tasks(*),
          prototypes:orchestrator_artifacts(id, kind, meta)
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
      
      // Generate game summary for display
      const gameSummary = generateGameSummary(body.brief);
      
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
      if (nextStatus === 'running' && shouldRequireHuman && ['synthesis', 'qa'].includes(nextPhase)) {
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

      // Generate artifacts for the new phase (not the completed one)
      if (nextPhase !== currentRun.phase) {
        await generatePhaseArtifacts(supabaseClient, runId, nextPhase, currentRun.brief);
      }
      
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

    if (method === 'POST' && path.match(/^\/runs\/[^\/]+\/force-advance$/)) {
      // Force advance a stuck run to next phase
      const runId = path.split('/')[2]
      
      console.log(`🔧 Force advancing run ${runId}`)

      // Get current run
      const { data: currentRun, error: fetchError } = await supabaseClient
        .from('orchestrator_runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Determine next phase
      const phaseOrder = ['intake', 'market', 'synthesis', 'deconstruct', 'prioritize', 'build', 'qa', 'deploy', 'measure', 'decision']
      const currentPhaseIndex = phaseOrder.indexOf(currentRun.phase)
      
      let nextPhase = currentRun.phase
      let nextStatus = 'running'
      
      if (currentPhaseIndex < phaseOrder.length - 1) {
        nextPhase = phaseOrder[currentPhaseIndex + 1]
        nextStatus = 'running'
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
        .eq('id', runId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Generate artifacts for the new phase
      if (nextPhase !== currentRun.phase) {
        await generatePhaseArtifacts(supabaseClient, runId, nextPhase, currentRun.brief);
      }

      console.log(`🚀 Force advanced run ${runId} from ${currentRun.phase} to ${nextPhase}`)

      return new Response(
        JSON.stringify({ success: true, run: updatedRun, message: `Run advanced from ${currentRun.phase} to ${nextPhase}` }),
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
          const { phase, comments } = body

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

          // If comments are provided (from rejection), store them in logs
          if (comments) {
            await supabaseClient
              .from('orchestrator_logs')
              .insert({
                run_id: runId,
                phase: currentRun.phase,
                agent: 'human-reviewer',
                level: 'info',
                message: `Phase rejected with comments: ${comments}`,
                thinking_trace: `Human rejection feedback for ${currentRun.phase} phase`,
                llm_response: null,
                created_at: new Date().toISOString()
              });

            console.log(`📝 Stored rejection comments for run ${runId}: ${comments}`);
          }

          // Generate artifacts for the specified phase (force regeneration for manual requests)
          await generatePhaseArtifacts(supabaseClient, runId, phase, currentRun.brief, true)

          // If this is a different phase than current, update the run
          if (phase !== currentRun.phase) {
            await supabaseClient
              .from('orchestrator_runs')
              .update({
                phase: phase,
                status: 'running',
                updated_at: new Date().toISOString()
              })
              .eq('id', runId);
          }

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
          
          // CRITICAL FIX: Generate artifacts for the current phase when starting (with brief like force-phase)
          try {
            console.log(`🎨 Auto-processing: Generating artifacts for ${run.phase} phase...`)
            await generatePhaseArtifacts(supabaseClient, run.id, run.phase, run.brief)
            console.log(`✅ Auto-processing: Generated artifacts for ${run.phase} phase`)
          } catch (artifactError) {
            console.error(`❌ Auto-processing: Failed to generate artifacts for ${run.phase}:`, artifactError)
          }
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
            
            // Check if human approvals are required for this run (fallback to brief setting)
            const shouldRequireHuman = (run.require_human_approvals || run.brief?.requireHumanApprovals) && ['synthesis', 'qa'].includes(nextPhase)
            if (shouldRequireHuman) {
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
            
            // CRITICAL FIX: Generate artifacts for the new phase (with brief like force-phase)
            try {
              console.log(`🎨 Auto-processing: Generating artifacts for ${nextPhase} phase...`)
              await generatePhaseArtifacts(supabaseClient, run.id, nextPhase, run.brief)
              console.log(`✅ Auto-processing: Generated artifacts for ${nextPhase} phase`)
            } catch (artifactError) {
              console.error(`❌ Auto-processing: Failed to generate artifacts for ${nextPhase}:`, artifactError)
            }
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

    // Test endpoint for Claude API
    if (path === '/test-claude') {
      try {
        console.log('🧪 Testing Claude API...');
        const testResult = await callLLMWithTimeout(
          'claude-sonnet-4-20250514',
          [{
            role: 'user',
            content: 'Respond with exactly this JSON: {"test": "success", "message": "Claude API is working"}'
          }],
          undefined, // no tools
          undefined, // default temperature
          30000 // 30 second timeout for test
          // max_tokens will be auto-detected as 64000 for Claude Sonnet 4
        );
        
        return new Response(JSON.stringify({ 
          success: true, 
          claude_response: testResult.content[0].text,
          model: 'claude-sonnet-4-20250514'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message,
          api_key_present: !!Deno.env.get('ANTHROPIC_API_KEY')
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
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
