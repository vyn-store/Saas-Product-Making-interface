'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MediaGenerationData, checkMediaGenerationStatus } from '@/app/actions'

type Step = {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  duration: number // in seconds
}

export default function GenerationPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing...')
  const [mediaData, setMediaData] = useState<MediaGenerationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startTime] = useState(Date.now())

  // Step tracking with durations
  const [steps, setSteps] = useState<Step[]>([
    { id: 'init', label: 'Initializing AI', status: 'in_progress', duration: 5 },
    { id: 'analyze', label: 'Analyzing Product', status: 'pending', duration: 10 },
    { id: 'image', label: 'Generating Image', status: 'pending', duration: 35 },
    { id: 'video', label: 'Creating Video', status: 'pending', duration: 90 },
  ])

  // Fake progress simulation while waiting for actual n8n response
  useEffect(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0) // 140 seconds total

    const updateFakeProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000 // seconds elapsed

      if (elapsed >= totalDuration) {
        // Cap at 95% - let real API finish at 100%
        setProgress(95)
        return
      }

      // Calculate cumulative time and progress
      let cumulativeTime = 0
      let newProgress = 0
      const newSteps = steps.map((step, index) => {
        const stepStartTime = cumulativeTime
        const stepEndTime = cumulativeTime + step.duration

        if (elapsed < stepStartTime) {
          return { ...step, status: 'pending' as const }
        } else if (elapsed >= stepStartTime && elapsed < stepEndTime) {
          const stepProgress = ((elapsed - stepStartTime) / step.duration) * 100
          newProgress = ((cumulativeTime + (elapsed - stepStartTime)) / totalDuration) * 95 // Cap at 95%
          setCurrentStep(`${step.label}...`)
          cumulativeTime += step.duration
          return { ...step, status: 'in_progress' as const }
        } else {
          newProgress = Math.min(((stepEndTime) / totalDuration) * 95, 95)
          cumulativeTime += step.duration
          return { ...step, status: 'completed' as const }
        }
      })

      setSteps(newSteps)
      setProgress(Math.round(newProgress))
    }

    const intervalId = setInterval(updateFakeProgress, 200) // Update every 200ms for smooth animation

    return () => clearInterval(intervalId)
  }, [startTime, steps.length])

  // Real n8n API polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const result = await checkMediaGenerationStatus(jobId)

        if (result.status === 'completed' && result.data) {
          setStatus('completed')
          setProgress(100)
          setCurrentStep('Complete!')
          setMediaData(result.data)
          // Mark all steps as completed
          setSteps(steps.map(s => ({ ...s, status: 'completed' })))
          clearInterval(pollInterval)
        } else if (result.status === 'failed') {
          setStatus('failed')
          setError(result.error || 'Media generation failed')
          clearInterval(pollInterval)
        }
        // If still processing, keep fake progress running
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }

    pollStatus()
    pollInterval = setInterval(pollStatus, 5000)

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [jobId])

  const getStepIcon = (stepStatus: Step['status']) => {
    switch (stepStatus) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'in_progress':
        return (
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        )
      case 'failed':
        return (
          <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <div className="w-5 h-5 border-2 border-[var(--border)] rounded-full" />
        )
    }
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
          {status === 'processing' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm font-medium mb-4 border border-[var(--accent)]/20">
              <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse-soft" />
              <span>Generating Media</span>
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
            {status === 'processing' ? 'Creating Your Content' : status === 'completed' ? 'Content Ready' : 'Generation Failed'}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Job ID: <span className="font-mono text-[var(--text-secondary)]">{jobId}</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
        {status === 'processing' && (
          <div className="space-y-8 animate-fade-in">
            {/* Progress Overview Card */}
            <div className="card p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {currentStep}
                  </h2>
                  <span className="text-2xl font-bold text-[var(--accent)] font-display">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--border-light)] h-3 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-600 transition-all duration-500 ease-out rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 animate-shimmer opacity-50" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This usually takes 2-3 minutes. Keep this page open.
              </p>
            </div>

            {/* Step-by-Step Progress */}
            <div className="card p-8">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-6">
                Generation Steps
              </h3>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        step.status === 'completed' ? 'bg-[var(--success)]/10 border border-[var(--success)]' :
                        step.status === 'in_progress' ? 'bg-[var(--accent)]/10 border border-[var(--accent)]' :
                        step.status === 'failed' ? 'bg-[var(--error)]/10 border border-[var(--error)]' :
                        'bg-[var(--card-bg-elevated)] border border-[var(--border)]'
                      }`}>
                        {getStepIcon(step.status)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`font-semibold ${
                          step.status === 'in_progress' ? 'text-[var(--accent)]' :
                          step.status === 'completed' ? 'text-[var(--success)]' :
                          step.status === 'failed' ? 'text-[var(--error)]' :
                          'text-[var(--text-tertiary)]'
                        }`}>
                          {step.label}
                        </h4>
                        {step.status === 'in_progress' && (
                          <span className="px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium rounded-full border border-[var(--accent)]/20">
                            Active
                          </span>
                        )}
                        {step.status === 'completed' && (
                          <span className="px-2 py-0.5 bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium rounded-full border border-[var(--success)]/20">
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {step.status === 'in_progress' && 'Processing...'}
                        {step.status === 'completed' && 'Successfully completed'}
                        {step.status === 'pending' && 'Waiting to start'}
                        {step.status === 'failed' && 'Failed to complete'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && mediaData && (
          <div className="animate-scale-in space-y-8">
            {/* Success Banner */}
            <div className="card p-6 border-l-4 border-[var(--success)]">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--success)]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-1">
                    Content Ready!
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your media is ready to download and use
                  </p>
                </div>
              </div>
            </div>

            {/* Generated Media */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI Generated Image */}
              <div className="card overflow-hidden group">
                <div className="relative aspect-square bg-black/40">
                  <img
                    src={mediaData.imageUrl}
                    alt="AI Generated Product Image"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-[var(--accent)] text-black rounded-full text-xs font-bold shadow-glow">
                    Generated Image
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Image Prompt</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{mediaData.imagePrompt}</p>
                </div>
              </div>

              {/* AI Generated Video */}
              <div className="card overflow-hidden group">
                <div className="relative aspect-square bg-black/40">
                  <video
                    src={mediaData.videoUrl}
                    controls
                    loop
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-bold shadow-lg">
                    Generated Video
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Video Prompt</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{mediaData.videoPrompt}</p>
                </div>
              </div>
            </div>

            {/* Download Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={mediaData.imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Image</span>
              </a>
              <a
                href={mediaData.videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Video</span>
              </a>
              <button
                onClick={() => router.push('/')}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Generate Another</span>
              </button>
            </div>

            <div className="text-center text-xs text-[var(--text-tertiary)]">
              Generated at {new Date(mediaData.generatedAt).toLocaleString()}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="animate-slide-up">
            <div className="card p-8 border-l-4 border-[var(--error)]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--error)]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
                    Generation Failed
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {error || 'An error occurred during content generation'}
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Products</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
