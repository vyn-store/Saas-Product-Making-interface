import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for results (in production, use Redis or a database)
const resultsStore = new Map<string, any>()

// POST endpoint - n8n calls this with the results
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const body = await request.json()

    console.log('='.repeat(80))
    console.log('[Results API POST] RECEIVED RESULTS FROM N8N')
    console.log('[Results API POST] JobId:', jobId)
    console.log('[Results API POST] Full Body:', JSON.stringify(body, null, 2))
    console.log('[Results API POST] imageUrl:', body.imageUrl || 'MISSING')
    console.log('[Results API POST] videoUrl:', body.videoUrl || 'MISSING')
    console.log('[Results API POST] imagePrompt:', body.imagePrompt || 'MISSING')
    console.log('[Results API POST] videoPrompt:', body.videoPrompt || 'MISSING')
    console.log('[Results API POST] error:', body.error || 'NONE')
    console.log('='.repeat(80))

    // Store the results
    resultsStore.set(jobId, {
      ...body,
      receivedAt: new Date().toISOString()
    })

    console.log('[Results API POST] ✓ Results stored successfully in memory')
    console.log('[Results API POST] Current store size:', resultsStore.size, 'entries')

    return NextResponse.json({
      success: true,
      message: 'Results stored successfully'
    })
  } catch (error) {
    console.error('[Results API POST] ✗ ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to store results' },
      { status: 500 }
    )
  }
}

// GET endpoint - frontend polls this to check for results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    console.log('[Results API GET] Polling for jobId:', jobId)

    // Check if results exist
    const results = resultsStore.get(jobId)

    if (results) {
      console.log('[Results API GET] ✓ Results found!')
      console.log('[Results API GET] - imageUrl:', results.imageUrl ? '✓ Present' : '✗ MISSING')
      console.log('[Results API GET] - videoUrl:', results.videoUrl ? '✓ Present' : '✗ MISSING')
      console.log('[Results API GET] - imagePrompt:', results.imagePrompt ? '✓ Present' : '✗ MISSING')
      console.log('[Results API GET] - videoPrompt:', results.videoPrompt ? '✓ Present' : '✗ MISSING')
      console.log('[Results API GET] Returning data to frontend...')

      return NextResponse.json({
        success: true,
        status: 'completed',
        data: results
      })
    } else {
      console.log('[Results API GET] ⏳ No results yet (still processing)')
      console.log('[Results API GET] Store has', resultsStore.size, 'total entries')
      return NextResponse.json({
        success: false,
        status: 'processing',
        message: 'Results not yet available'
      })
    }
  } catch (error) {
    console.error('[Results API GET] ✗ ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve results' },
      { status: 500 }
    )
  }
}
