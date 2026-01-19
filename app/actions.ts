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

    if (!webhookUrl) {
      return {
        success: false,
        status: 'failed',
        error: 'Media generation webhook URL not configured'
      }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        error: `HTTP error! status: ${response.status}`
      }
    }

    const responseData = await response.json()

    return {
      success: responseData.success,
      status: responseData.status,
      jobId: responseData.jobId,
      productName: responseData.productName,
      message: responseData.message,
      data: responseData.data
    }
  } catch (error) {
    console.error('Error generating media:', error)
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate media'
    }
  }
}

// Poll for media generation status
export async function checkMediaGenerationStatus(jobId: string): Promise<MediaGenerationJobResponse & { progress?: number }> {
  try {
    // Build absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/status/${jobId}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        error: `HTTP error! status: ${response.status}`
      }
    }

    const data = await response.json()

    return {
      success: data.success,
      status: data.status,
      message: data.message,
      data: data.data,
      error: data.error,
      progress: data.progress
    }
  } catch (error) {
    console.error('Error checking status:', error)
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to check status'
    }
  }
}
