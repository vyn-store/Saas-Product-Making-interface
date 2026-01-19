'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface GenerationResults {
  imageUrl?: string
  videoUrl?: string
  imagePrompt?: string
  videoPrompt?: string
  error?: string
}

export default function GenerationPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [results, setResults] = useState<GenerationResults | null>(null)
  const estimatedTime = 300 // 5 minutes in seconds

  // Timer effect for progress bar
  useEffect(() => {
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)

      // Calculate progress based on estimated time, cap at 95% until results arrive
      const calculatedProgress = Math.min((elapsed / estimatedTime) * 100, 95)
      setProgress(Math.round(calculatedProgress))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Polling effect to check for results
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/results/${jobId}`)
        const data = await response.json()

        if (data.success && data.status === 'completed') {
          setResults(data.data)
          setIsComplete(true)
          setProgress(100)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('[Results Poll] Error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [jobId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentStep = () => {
    if (elapsedTime < 15) return 'Initializing AI systems...'
    if (elapsedTime < 45) return 'Analyzing product details...'
    if (elapsedTime < 120) return 'Generating AI image...'
    if (elapsedTime < 240) return 'Creating AI video...'
    return 'Processing final results...'
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--border)] bg-[var(--card-bg)]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Products</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded flex items-center justify-center text-black font-bold text-xs shadow-glow">
                V
              </div>
              <span className="font-display font-bold text-sm text-[var(--text-primary)]">VYNCOM</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-slide-up">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm font-medium mb-4 border border-[var(--accent)]/20">
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse-soft" />
            <span>Generating Media</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Creating Your Content
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-2">
            Job ID: <span className="font-mono text-[var(--text-secondary)]">{jobId}</span>
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Elapsed: {formatTime(elapsedTime)} / Estimated: {formatTime(estimatedTime)}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
        {isComplete ? (
          <div className="space-y-8 animate-scale-in">
            {/* Completion Card */}
            <div className="card p-8 border-l-4 border-green-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3">
                    Generation Complete!
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    {results ? 'Your AI-generated image and video are ready!' : 'Your content should now be ready. Check your n8n workflow execution to download your media.'}
                  </p>

                  {results && (results.imageUrl || results.videoUrl) ? (
                    <div className="space-y-6 mb-6">
                      {/* Generated Image */}
                      {results.imageUrl && (
                        <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-6">
                          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Generated Image
                          </h3>
                          <div className="rounded-lg overflow-hidden mb-4 bg-black/20">
                            <img src={results.imageUrl} alt="Generated product" className="w-full h-auto" />
                          </div>
                          {results.imagePrompt && (
                            <div className="mb-3">
                              <p className="text-xs text-[var(--text-tertiary)] mb-1 font-semibold">Image Prompt:</p>
                              <p className="text-sm text-[var(--text-secondary)] italic">{results.imagePrompt}</p>
                            </div>
                          )}
                          <a
                            href={results.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary inline-flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Image
                          </a>
                        </div>
                      )}

                      {/* Generated Video */}
                      {results.videoUrl && (
                        <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-6">
                          <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Generated Video
                          </h3>
                          <div className="rounded-lg overflow-hidden mb-4 bg-black/20">
                            <video src={results.videoUrl} controls className="w-full h-auto" />
                          </div>
                          {results.videoPrompt && (
                            <div className="mb-3">
                              <p className="text-xs text-[var(--text-tertiary)] mb-1 font-semibold">Video Prompt:</p>
                              <p className="text-sm text-[var(--text-secondary)] italic">{results.videoPrompt}</p>
                            </div>
                          )}
                          <a
                            href={results.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary inline-flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Video
                          </a>
                        </div>
                      )}
                    </div>
                  ) : !results && (
                    <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-6 mb-6">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How to Get Your Media
                      </h3>
                      <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-xs">1</span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Open n8n Dashboard</p>
                            <p className="text-xs mt-1">Visit <a href="https://kvktrades.app.n8n.cloud" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">kvktrades.app.n8n.cloud</a></p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-xs">2</span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Find Your Workflow</p>
                            <p className="text-xs mt-1">Go to "Product Media Generation" workflow</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-xs">3</span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Check Execution</p>
                            <p className="text-xs mt-1">Find execution with Job ID: <span className="font-mono text-[var(--accent)]">{jobId}</span></p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)] font-bold text-xs">4</span>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Download Your Media</p>
                            <p className="text-xs mt-1">You'll find image and video URLs in the final node output</p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    {!results && (
                      <a
                        href="https://kvktrades.app.n8n.cloud"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center justify-center gap-2 flex-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Open n8n Dashboard</span>
                      </a>
                    )}
                    <button
                      onClick={() => router.push('/')}
                      className={`btn-${results ? 'primary' : 'secondary'} flex items-center justify-center gap-2 flex-1`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Generate Another</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
          {/* Progress Overview Card */}
          <div className="card p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {getCurrentStep()}
                </h2>
                <span className="text-2xl font-bold text-[var(--accent)] font-display">
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[var(--border-light)] h-3 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-600 transition-all duration-1000 ease-out rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 animate-shimmer opacity-50" />
                </div>
              </div>
            </div>

            <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    Generation in Progress
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    Your AI-generated image and video are being created. This process typically takes 4-5 minutes. Please wait while we generate your content.
                  </p>
                  <div className="space-y-2 text-sm text-[var(--text-tertiary)]">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Keep this page open while we generate your media</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Image generation: ~2 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Video generation: ~3 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card p-8 border-l-4 border-blue-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                  Please Wait
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  Your media is being generated in the background. This page will automatically refresh when your content is ready. The generation process uses advanced AI and may take up to 5 minutes.
                </p>
                <div className="bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <p className="text-xs text-[var(--text-tertiary)] mb-2 font-semibold">Generation Steps:</p>
                  <ul className="space-y-1 text-xs text-[var(--text-tertiary)]">
                    <li>• AI analyzes product details and creates optimal prompts</li>
                    <li>• Image is generated using Flux AI (1-2 minutes)</li>
                    <li>• Video is created from the image using Luma AI (2-3 minutes)</li>
                    <li>• Content is processed and prepared for download</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  )
}
