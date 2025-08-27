import React, { useEffect, useCallback, useState } from 'react'

interface ImageLightboxProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex)

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!images || images.length === 0) return null

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
        {images.length > 1 && (
          <>
            <button className="lightbox-nav prev" onClick={prev} aria-label="Previous">‹</button>
            <button className="lightbox-nav next" onClick={next} aria-label="Next">›</button>
          </>
        )}
        <img
          src={images[index]}
          alt={`Image ${index + 1} of ${images.length}`}
          className="lightbox-image"
          onError={(e) => {
            // Hide image on error to avoid broken UI
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
          }}
        />
        {images.length > 1 && (
          <div className="lightbox-counter">{index + 1} / {images.length}</div>
        )}
      </div>
    </div>
  )
}

export default ImageLightbox

