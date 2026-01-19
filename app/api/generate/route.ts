import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_MEDIA_GEN_WEBHOOK_URL

    console.log('[API /api/generate] Starting...')
    console.log('[API /api/generate] Webhook URL:', webhookUrl ? 'SET' : 'NOT SET')
    console.log('[API /api/generate] Full Webhook URL:', webhookUrl)

    if (!webhookUrl) {
      console.error('[API /api/generate] Webhook URL not configured')
      return NextResponse.json({
        success: false,
        status: 'failed',
        error: 'Media generation webhook URL not configured'
      }, { status: 500 })
    }

    const body = await request.json()
    console.log('[API /api/generate] Request body:', JSON.stringify(body, null, 2))

    console.log('[API /api/generate] Making fetch request to n8n...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    console.log('[API /api/generate] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API /api/generate] HTTP error:', response.status, errorText.substring(0, 200))

      const isHTML = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<!doctype')
      const errorMessage = isHTML
        ? `Webhook error (${response.status}): Unable to reach n8n workflow. Please check webhook URL.`
        : `HTTP ${response.status}: ${errorText.substring(0, 100)}`

      return NextResponse.json({
        success: false,
        status: 'failed',
        error: errorMessage
      }, { status: response.status })
    }

    const responseData = await response.json()
    console.log('[API /api/generate] Response data:', responseData)

    return NextResponse.json({
      success: responseData.success,
      status: responseData.status,
      jobId: responseData.jobId,
      productName: responseData.productName,
      message: responseData.message,
      data: responseData.data
    })
  } catch (error) {
    console.error('[API /api/generate] Catch block error:', error)
    console.error('[API /api/generate] Error type:', error instanceof Error ? 'Error' : typeof error)
    console.error('[API /api/generate] Error message:', error instanceof Error ? error.message : String(error))

    return NextResponse.json({
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate media'
    }, { status: 500 })
  }
}
