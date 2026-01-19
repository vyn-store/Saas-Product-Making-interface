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

    console.log('[Results API] Received results for jobId:', jobId)
    console.log('[Results API] Data:', JSON.stringify(body, null, 2))

    // Store the results
    resultsStore.set(jobId, {
      ...body,
      receivedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Results stored successfully'
    })
  } catch (error) {
    console.error('[Results API POST] Error:', error)
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

    console.log('[Results API GET] Checking for jobId:', jobId)

    // Check if results exist
    const results = resultsStore.get(jobId)

    if (results) {
      console.log('[Results API GET] Results found for jobId:', jobId)
      return NextResponse.json({
        success: true,
        status: 'completed',
        data: results
      })
    } else {
      console.log('[Results API GET] No results yet for jobId:', jobId)
      return NextResponse.json({
        success: false,
        status: 'processing',
        message: 'Results not yet available'
      })
    }
  } catch (error) {
    console.error('[Results API GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve results' },
      { status: 500 }
    )
  }
}
