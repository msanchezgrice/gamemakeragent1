import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { runId } = await request.json();
    
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    console.log(`🎮 Proxying upload request for run ${runId}`);
    
    // Call the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/orchestrator-api/runs/${runId}/upload-to-clipcade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Upload failed:', result);
      return NextResponse.json({ 
        error: result.message || 'Upload failed',
        details: result 
      }, { status: response.status });
    }
    
    console.log('✅ Upload successful:', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
