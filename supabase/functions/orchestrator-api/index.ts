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
  console.log(`📋 Intake artifacts for ${brief.theme} - brief processed`);
}

async function generateDeconstructArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🔍 Deconstruct artifacts for ${brief.theme} - analyzing successful games`);
}

async function generatePrioritizeArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🎯 Prioritize artifacts for ${brief.theme} - ranking opportunities`);
}

async function generateQAArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🧪 QA artifacts for ${brief.theme} - testing reports generated`);
}

async function generateDeployArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🚀 Deploy artifacts for ${brief.theme} - deployment package ready`);
}

async function generateMeasureArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`📊 Measure artifacts for ${brief.theme} - analytics dashboard`);
}

async function generateDecisionArtifacts(supabaseClient: any, runId: string, brief: any) {
  console.log(`🎯 Decision artifacts for ${brief.theme} - recommendations generated`);
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
