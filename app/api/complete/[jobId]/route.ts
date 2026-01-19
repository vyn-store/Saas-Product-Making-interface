import { NextRequest, NextResponse } from 'next/server'

// This endpoint receives the completion callback from n8n
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const body = await request.json()

    console.log('[Complete API] Received completion for jobId:', jobId)
    console.log('[Complete API] Data:', JSON.stringify(body, null, 2))

    // Store the result in memory (in production, use Redis or a database)
    // For now, we'll just log it and return success
    // The frontend will poll this endpoint to check if results are ready

    return NextResponse.json({
      success: true,
      message: 'Completion received'
    })
  } catch (error) {
    console.error('[Complete API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process completion' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if results are ready
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  // In production, check Redis/database for stored results
  // For now, return not found
  return NextResponse.json(
    { success: false, status: 'processing' },
    { status: 404 }
  )
}
