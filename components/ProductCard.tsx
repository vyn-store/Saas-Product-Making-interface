'use client'

import Image from 'next/image'
import { ProductData } from '@/app/actions'
import { useState } from 'react'

interface ProductCardProps {
  product: ProductData
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const originalPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice

  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  return (
    <div className="w-full max-w-5xl mx-auto card animate-scale-in overflow-hidden">
      {/* Image Gallery */}
      <div className="relative aspect-video bg-black/40 overflow-hidden group">
        <Image
          src={product.images[currentImageIndex]}
          alt={product.name}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 1024px"
          priority
        />

        {/* Image Navigation */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--accent)] border border-[var(--accent)]/30 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl hover:bg-[var(--accent)] hover:text-black transition-all duration-200 z-20 shadow-lg"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--card-bg)]/90 backdrop-blur-sm text-[var(--accent)] border border-[var(--accent)]/30 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl hover:bg-[var(--accent)] hover:text-black transition-all duration-200 z-20 shadow-lg"
              aria-label="Next image"
            >
              ›
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--card-bg)]/90 backdrop-blur-sm border border-[var(--accent)]/30 px-4 py-2 rounded-full text-xs text-[var(--accent)] font-medium z-20">
              {currentImageIndex + 1} / {product.images.length}
            </div>
          </>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 md:p-8 space-y-5">
        {/* Category Badge */}
        {product.categoryName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-xs font-semibold border border-[var(--accent)]/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {product.categoryName}
          </div>
        )}

        {/* Product Name */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight">
          {product.name}
        </h2>

        {/* Description */}
        {product.description && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Pricing Section */}
        <div className="flex items-center gap-4 py-4 border-y border-[var(--border)]">
          <div className="flex items-baseline gap-3">
            <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] font-display">
              ${price.toFixed(2)}
            </div>
            {discount > 0 && (
              <>
                <div className="text-lg line-through text-[var(--text-tertiary)]">
                  ${originalPrice.toFixed(2)}
                </div>
                <div className="px-2.5 py-1 bg-[var(--error)] text-white text-sm font-bold rounded-md">
                  -{discount}%
                </div>
              </>
            )}
          </div>
        </div>

        {/* Shipping Countries */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ships From</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.shipFromCountries.slice(0, 10).map((country) => (
              <span
                key={country}
                className="px-3 py-1.5 bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {country}
              </span>
            ))}
            {product.shipFromCountries.length > 10 && (
              <span className="px-3 py-1.5 bg-[var(--card-bg-elevated)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text-tertiary)]">
                +{product.shipFromCountries.length - 10} more
              </span>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-3">
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full flex items-center justify-center gap-2 text-center"
          >
            <span>View Product Details</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Product Metadata */}
        <div className="pt-3 flex flex-col gap-1.5 text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center gap-2">
            <span className="font-medium">Product ID:</span>
            <span className="font-mono">{product.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Retrieved:</span>
            <span>{new Date(product.fetchedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
