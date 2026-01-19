import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  try {
    const n8nApiKey = process.env.N8N_API_KEY
    const n8nBaseUrl = process.env.N8N_BASE_URL

    console.log('[Status API] Checking status for jobId:', jobId)
    console.log('[Status API] N8N_API_KEY:', n8nApiKey ? 'SET (length: ' + n8nApiKey.length + ')' : 'NOT SET')
    console.log('[Status API] N8N_BASE_URL:', n8nBaseUrl ? n8nBaseUrl : 'NOT SET')

    if (!n8nApiKey || !n8nBaseUrl) {
      console.error('[Status API] N8N credentials not configured')
      return NextResponse.json(
        { success: false, status: 'failed', error: 'N8N API not configured' },
        { status: 500 }
      )
    }

    // Query n8n executions API for this workflow
    const workflowId = 'LYyh2ovT6sJoxGiG' // Product Media Generation workflow

    // Get recent executions
    const executionsUrl = `${n8nBaseUrl}/api/v1/executions?workflowId=${workflowId}&limit=50`
    console.log('[Status API] Fetching executions from:', executionsUrl)

    const executionsResponse = await fetch(executionsUrl, {
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
      },
    })

    console.log('[Status API] Executions response status:', executionsResponse.status)

    if (!executionsResponse.ok) {
      const errorText = await executionsResponse.text()
      console.error('[Status API] Failed to query n8n:', executionsResponse.status, errorText.substring(0, 200))
      return NextResponse.json(
        { success: false, status: 'failed', error: 'Failed to query n8n: ' + executionsResponse.status },
        { status: 500 }
      )
    }

    const executionsData = await executionsResponse.json()
    const executions = executionsData.data || []

    // Find execution with matching jobId
    // We need to check execution data which requires a separate API call
    for (const execution of executions) {
      // Get detailed execution data
      const detailUrl = `${n8nBaseUrl}/api/v1/executions/${execution.id}?includeData=true`
      const detailResponse = await fetch(detailUrl, {
        headers: {
          'X-N8N-API-KEY': n8nApiKey,
        },
      })

      if (!detailResponse.ok) continue

      const detailData = await detailResponse.json()

      // Check if this execution has our jobId
      const runData = detailData.data?.resultData?.runData
      if (!runData) continue

      // Look for jobId in "Add Job Metadata" or "Generate Job ID" node
      const jobMetadata = runData['Add Job Metadata'] || runData['Generate Job ID']
      if (!jobMetadata || !jobMetadata[0]) continue

      const executionJobId = jobMetadata[0].data?.main?.[0]?.[0]?.json?.jobId

      if (executionJobId === jobId) {
        // Found matching execution!
        const status = execution.status

        if (status === 'success') {
          // Check if workflow completed successfully or with error
          const metadataNode = runData['Add Job Metadata']
          if (metadataNode && metadataNode[0]) {
            const metadata = metadataNode[0].data?.main?.[0]?.[0]?.json

            // Check if it was an error case
            if (metadata?.success === false || metadata?.error) {
              return NextResponse.json({
                success: false,
                status: 'failed',
                error: metadata?.error || 'Media generation failed'
              })
            }
          }

          // Extract final media data
          const formatResponseData = runData['Format Response']
          if (formatResponseData && formatResponseData[0]) {
            const mediaData = formatResponseData[0].data?.main?.[0]?.[0]?.json

            return NextResponse.json({
              success: true,
              status: 'completed',
              data: {
                imageUrl: mediaData?.imageUrl,
                videoUrl: mediaData?.videoUrl,
                imagePrompt: mediaData?.imagePrompt,
                videoPrompt: mediaData?.videoPrompt,
                productName: mediaData?.productName,
                generatedAt: mediaData?.generatedAt || new Date().toISOString()
              }
            })
          }
        } else if (status === 'running' || status === 'waiting') {
          // Still processing - determine current step
          let currentStep = 'Initializing...'
          let progress = 10

          if (runData['Extract Prompts']) {
            progress = 30
            currentStep = 'AI analyzing product...'
          }
          if (runData['Create Image Task']) {
            progress = 40
            currentStep = 'Creating AI image...'
          }
          if (runData['Get Image']) {
            progress = 50
            currentStep = 'Checking image status...'
          }
          if (runData['Switch 2']) {
            progress = 60
            currentStep = 'Processing image...'
          }
          if (runData['Parse Image Result']) {
            progress = 70
            currentStep = 'Image complete!'
          }
          if (runData['Create Video Task']) {
            progress = 75
            currentStep = 'Creating AI video...'
          }
          if (runData['Get Video']) {
            progress = 85
            currentStep = 'Checking video status...'
          }
          if (runData['Switch ']) {
            progress = 90
            currentStep = 'Processing video...'
          }
          if (runData['Format Response']) {
            progress = 95
            currentStep = 'Finalizing...'
          }

          // Check if we hit an error node
          if (runData['Image Failed']) {
            progress = 65
            currentStep = 'Image generation failed, checking...'
          }
          if (runData['Video Failed']) {
            progress = 90
            currentStep = 'Video generation failed, checking...'
          }

          return NextResponse.json({
            success: false,
            status: 'processing',
            message: currentStep,
            progress
          })
        } else if (status === 'error') {
          // Execution failed
          const error = detailData.data?.resultData?.error?.message || 'Unknown error'

          return NextResponse.json({
            success: false,
            status: 'failed',
            error
          })
        }
      }
    }

    // Job not found - might be too old or still queued
    return NextResponse.json({
      success: false,
      status: 'processing',
      message: 'Job queued or initializing...',
      progress: 5
    })

  } catch (error) {
    console.error('[Status API] Catch block error:', error)
    console.error('[Status API] Error type:', error instanceof Error ? 'Error' : typeof error)
    console.error('[Status API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Status API] Error stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to check status'
      },
      { status: 500 }
    )
  }
}
