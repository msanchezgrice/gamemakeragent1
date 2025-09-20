import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

      if (error) {
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
            task_type: 'review',
            status: 'pending',
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

    if (method === 'POST' && path === '/process-runs') {
      // Auto-process running runs (simulate LLM work)
      const { data: runningRuns, error: fetchError } = await supabaseClient
        .from('orchestrator_runs')
        .select('*')
        .eq('status', 'running')

      if (fetchError) {
        throw fetchError
      }

      const processedRuns = []
      
      for (const run of runningRuns) {
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
                  task_type: 'review',
                  status: 'pending',
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
