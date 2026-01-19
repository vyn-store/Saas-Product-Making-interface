'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchRandomProduct, generateMediaForProduct, type ProductData, type MediaGenerationData } from './actions'
import ProductCard from '@/components/ProductCard'

export default function Home() {
  const router = useRouter()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaGenerating, setMediaGenerating] = useState(false)
  const [generatedMedia, setGeneratedMedia] = useState<MediaGenerationData | null>(null)

  const handleFetchProduct = async () => {
    setLoading(true)
    setError(null)
    setGeneratedMedia(null)

    const result = await fetchRandomProduct()

    if (result.success && result.data) {
      setProduct(result.data)
    } else {
      setError(result.error || 'Failed to fetch product')
    }

    setLoading(false)
  }

  const handleKeepProduct = async () => {
    if (!product) return

    console.log('[handleKeepProduct] Starting with product:', product.name)
    setMediaGenerating(true)
    setError(null)

    try {
      console.log('[handleKeepProduct] Calling generateMediaForProduct...')
      const result = await generateMediaForProduct(product)
      console.log('[handleKeepProduct] Got result:', result)

      if (result.success && result.jobId) {
        console.log('[handleKeepProduct] Success! Navigating to:', `/generation/${result.jobId}`)
        // Navigate to generation page with jobId
        router.push(`/generation/${result.jobId}`)
      } else {
        console.error('[handleKeepProduct] Failed:', result.error)
        setError(result.error || 'Failed to start media generation')
        setMediaGenerating(false)
      }
    } catch (error) {
      console.error('[handleKeepProduct] Unexpected error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setMediaGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--border)] bg-[var(--card-bg)]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-glow">
                V
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  VYNCOM
                </h1>
                <p className="text-xs text-[var(--text-tertiary)]">Build Product</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-slide-up">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
            Build Your Product<br />
            <span className="gradient-text">With AI-Generated Media</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Discover products and create professional marketing content instantly with AI-powered image and video generation.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16 space-y-8">
        {!product && !loading && (
          <div className="flex justify-center animate-fade-in">
            <button
              onClick={handleFetchProduct}
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <span>Discover Random Product</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-[var(--border-light)] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">Discovering product...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card max-w-2xl mx-auto p-6 border-l-4 border-[var(--error)] animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[var(--error)]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Something went wrong</h3>
                <p className="text-sm text-[var(--text-secondary)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Product Display */}
        {product && !loading && (
          <div className="animate-scale-in space-y-6">
            <ProductCard product={product} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
              <button
                onClick={handleFetchProduct}
                disabled={loading}
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Try Another Product</span>
              </button>
              <button
                onClick={handleKeepProduct}
                disabled={mediaGenerating}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                {mediaGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting Generation...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate AI Media</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Media Display */}
            {generatedMedia && (
              <div className="mt-8 space-y-6 animate-scale-in">
                <div className="border-t border-[var(--border)] pt-8">
                  <h2 className="font-display text-2xl md:text-3xl font-black uppercase mb-6 gradient-text text-center">
                    Generated Media
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* AI Generated Image */}
                    <div className="bg-gradient-to-br from-[var(--card-bg-elevated)] to-[var(--card-bg)] border border-[var(--border-light)] overflow-hidden group">
                      <div className="relative aspect-square bg-black">
                        <img
                          src={generatedMedia.imageUrl}
                          alt="AI Generated Product Image"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-[var(--accent)] text-black px-3 py-1.5 font-bold font-display text-xs uppercase">
                          AI Image
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="font-display font-bold text-sm uppercase text-gray-400">Image Prompt</div>
                        <div className="font-body text-sm text-gray-300 leading-relaxed">{generatedMedia.imagePrompt}</div>
                      </div>
                    </div>

                    {/* AI Generated Video */}
                    <div className="bg-gradient-to-br from-[var(--card-bg-elevated)] to-[var(--card-bg)] border border-[var(--border-light)] overflow-hidden group">
                      <div className="relative aspect-square bg-black">
                        <video
                          src={generatedMedia.videoUrl}
                          controls
                          loop
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1.5 font-bold font-display text-xs uppercase">
                          AI Video
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="font-display font-bold text-sm uppercase text-gray-400">Video Prompt</div>
                        <div className="font-body text-sm text-gray-300 leading-relaxed">{generatedMedia.videoPrompt}</div>
                      </div>
                    </div>
                  </div>

                  {/* Download Actions */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <a
                      href={generatedMedia.imageUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display font-bold text-sm py-3 px-6 uppercase tracking-wide border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all duration-300 text-center"
                    >
                      Download Image
                    </a>
                    <a
                      href={generatedMedia.videoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display font-bold text-sm py-3 px-6 uppercase tracking-wide border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 text-center"
                    >
                      Download Video
                    </a>
                  </div>

                  <div className="text-center mt-4 text-xs font-body text-gray-600">
                    Generated at {new Date(generatedMedia.generatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!product && !loading && !error && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="card p-12 text-center bg-gradient-to-br from-[var(--card-bg)] to-[var(--card-bg-elevated)]">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)]/10 to-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3">
                Ready to discover amazing products?
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
                Discover products and generate professional marketing content with AI-powered media generation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="text-2xl font-bold text-[var(--accent)] font-display mb-1">6,000+</div>
                  <div className="text-xs text-[var(--text-secondary)]">Products</div>
                </div>
                <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="text-2xl font-bold text-[var(--accent)] font-display mb-1">19</div>
                  <div className="text-xs text-[var(--text-secondary)]">Warehouses</div>
                </div>
                <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="text-2xl font-bold text-[var(--accent)] font-display mb-1">Instant</div>
                  <div className="text-xs text-[var(--text-secondary)]">AI Generation</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-[var(--border)] pb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2">
          <div className="text-sm text-[var(--text-tertiary)]">
            © 2026 VYNCOM. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
