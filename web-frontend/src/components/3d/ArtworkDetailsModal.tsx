/**
 * ArtworkDetailsModal.tsx
 * Side panel shown when visitor clicks an artwork in the Layout Editor 3D preview.
 * Light theme — matches the dashboard aesthetic.
 */
import {
  XMarkIcon, CurrencyDollarIcon, CalendarIcon,
  SwatchIcon, ScaleIcon,
} from '@heroicons/react/24/outline'
import type { Artwork } from '@/types'
import { formatPrice, formatDate } from '@/utils/helpers'

interface ArtworkDetailsModalProps {
  artwork: Artwork | null
  onClose: () => void
}

export default function ArtworkDetailsModal({ artwork, onClose }: ArtworkDetailsModalProps) {
  if (!artwork) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-fade-in"
           onClick={onClose} aria-hidden="true" />

      {/* Side panel — light theme */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50
                   bg-white border-l border-stone-200 shadow-2xl
                   overflow-y-auto flex flex-col animate-slide-up"
        role="dialog"
        aria-label={`Artwork details: ${artwork.title}`}
      >
        {/* Sticky header */}
        <div className="flex items-start justify-between p-5 border-b border-stone-100
                        sticky top-0 bg-white/95 backdrop-blur-xl z-10 shrink-0">
          <div className="pr-4 min-w-0">
            <h2 className="font-display text-xl font-bold text-stone-900 leading-tight">
              {artwork.title}
            </h2>
            {artwork.artistName && (
              <p className="text-sm text-gallery-600 mt-0.5 font-medium">
                by {artwork.artistName}
              </p>
            )}
          </div>
          <button onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700
                             hover:bg-stone-100 transition-colors shrink-0 focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-gallery-500/50"
                  aria-label="Close artwork details">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Image */}
        <div className="aspect-square overflow-hidden bg-stone-50">
          <img src={artwork.imageUrl} alt={artwork.title}
               className="w-full h-full object-contain" />
        </div>

        {/* Metadata */}
        <div className="p-5 flex flex-col gap-5 flex-1">

          {/* Description */}
          {artwork.description && (
            <div>
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                About this piece
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed border-l-2 border-gallery-200 pl-3 italic">
                {artwork.description}
              </p>
            </div>
          )}

          {/* Detail chips */}
          <div className="grid grid-cols-2 gap-2.5">
            {artwork.price != null && (
              <DetailChip icon={<CurrencyDollarIcon className="h-4 w-4" />}
                          label="Price" value={formatPrice(artwork.price)} highlight />
            )}
            {artwork.year && (
              <DetailChip icon={<CalendarIcon className="h-4 w-4" />}
                          label="Year" value={String(artwork.year)} />
            )}
            {artwork.artworkType && (
              <DetailChip icon={<SwatchIcon className="h-4 w-4" />}
                          label="Type" value={artwork.artworkType} />
            )}
            {artwork.dimensions && (
              <DetailChip icon={<ScaleIcon className="h-4 w-4" />}
                          label="Dimensions" value={artwork.dimensions} />
            )}
          </div>

          {/* Materials */}
          {artwork.materials && (
            <div>
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                Materials
              </h3>
              <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200
                             rounded-xl px-3 py-2.5 font-medium">
                {artwork.materials}
              </p>
            </div>
          )}

          {/* Date added */}
          <p className="text-xs text-stone-300 mt-auto pt-3 border-t border-stone-100">
            Added {formatDate(artwork.createdAt)}
          </p>
        </div>
      </aside>
    </>
  )
}

function DetailChip({
  icon, label, value, highlight = false,
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className={[
      'flex flex-col gap-1.5 p-3 rounded-xl border',
      highlight
        ? 'bg-gallery-50 border-gallery-200'
        : 'bg-stone-50 border-stone-200',
    ].join(' ')}>
      <div className={[
        'flex items-center gap-1.5',
        highlight ? 'text-gallery-500' : 'text-stone-400',
      ].join(' ')}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {label}
        </span>
      </div>
      <span className={[
        'text-sm font-bold',
        highlight ? 'text-gallery-700' : 'text-stone-800',
      ].join(' ')}>
        {value}
      </span>
    </div>
  )
}
