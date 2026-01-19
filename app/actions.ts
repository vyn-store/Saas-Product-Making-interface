'use server'

export interface ProductData {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  currency: string
  images: string[]
  mainImage: string
  categoryId: string
  categoryName: string
  variants: any[]
  shipFromCountries: string[]
  sourceUrl: string
  fetchedAt: string
}

export interface FetchProductResult {
  success: boolean
  data?: ProductData
  error?: string
}

export interface MediaGenerationData {
  imageUrl: string
  videoUrl: string
  imagePrompt: string
  videoPrompt: string
  productName: string
  generatedAt: string
}

export interface MediaGenerationResult {
  success: boolean
  data?: MediaGenerationData
  error?: string
}

export interface MediaGenerationJobResponse {
  success: boolean
  status: 'processing' | 'completed' | 'failed'
  jobId?: string
  productName?: string
  message?: string
  data?: MediaGenerationData
  error?: string
}

export async function fetchRandomProduct(): Promise<FetchProductResult> {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_CJ_WEBHOOK_URL

    if (!webhookUrl) {
      return {
        success: false,
        error: 'Webhook URL not configured'
      }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'start' }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`
      }
    }

    const productData = await response.json()

    return {
      success: true,
      data: productData
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product'
    }
  }
}

export async function generateMediaForProduct(product: ProductData): Promise<MediaGenerationJobResponse> {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_MEDIA_GEN_WEBHOOK_URL

    console.log('[generateMediaForProduct] Starting...')
    console.log('[generateMediaForProduct] Webhook URL:', webhookUrl ? 'SET' : 'NOT SET')
    console.log('[generateMediaForProduct] Full Webhook URL:', webhookUrl)
    console.log('[generateMediaForProduct] Product:', product.name)
    console.log('[generateMediaForProduct] Product data:', JSON.stringify(product, null, 2))

    if (!webhookUrl) {
      console.error('[generateMediaForProduct] Webhook URL not configured')
      return {
        success: false,
        status: 'failed',
        error: 'Media generation webhook URL not configured'
      }
    }

    console.log('[generateMediaForProduct] Making fetch request...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product }),
      cache: 'no-store',
    })

    console.log('[generateMediaForProduct] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[generateMediaForProduct] HTTP error:', response.status, errorText.substring(0, 200))

      // Check if it's an HTML error page
      const isHTML = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<!doctype')
      const errorMessage = isHTML
        ? `Webhook error (${response.status}): Unable to reach n8n workflow. Please check webhook URL.`
        : `HTTP ${response.status}: ${errorText.substring(0, 100)}`

      return {
        success: false,
        status: 'failed',
        error: errorMessage
      }
    }

    const responseData = await response.json()
    console.log('[generateMediaForProduct] Response data:', responseData)

    return {
      success: responseData.success,
      status: responseData.status,
      jobId: responseData.jobId,
      productName: responseData.productName,
      message: responseData.message,
      data: responseData.data
    }
  } catch (error) {
    console.error('[generateMediaForProduct] Catch block error:', error)
    console.error('[generateMediaForProduct] Error type:', error instanceof Error ? 'Error' : typeof error)
    console.error('[generateMediaForProduct] Error message:', error instanceof Error ? error.message : String(error))
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate media'
    }
  }
}

// Note: Status checking has been removed - users should check n8n dashboard directly
// The generation workflow runs asynchronously and results are available in n8n
