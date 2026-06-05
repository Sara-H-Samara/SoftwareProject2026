import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CloudArrowUpIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import { useMyArtworks, useDeleteArtwork, useUpdateArtwork } from '@/hooks/useArtworks'
import { ROUTES } from '@/utils/constants'
import { formatPrice } from '@/utils/helpers'
import { SkeletonGrid } from '@/components/common/Spinner'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import type { Artwork } from '@/types'

export default function MyArtworksPage() {
  const { data: artworks, isLoading } = useMyArtworks()
  const { mutate: deleteArtwork, isPending: isDeleting } = useDeleteArtwork()
  const { mutate: updateArtwork, isPending: isUpdating } = useUpdateArtwork()
  const [confirmDelete, setConfirmDelete] = useState<Artwork | null>(null)

  const handleTogglePublish = (artwork: Artwork) => {
    updateArtwork({ id: artwork.id, data: { isPublished: !artwork.isPublished } })
  }

  const handleDelete = () => {
    if (confirmDelete) {
      deleteArtwork(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Artworks</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {artworks?.length ?? 0} artwork{artworks?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to={ROUTES.DASHBOARD_UPLOAD}>
          <Button leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}>
            Upload new
          </Button>
        </Link>
      </div>

      {/* Artwork grid */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : !artworks?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artworks.map((artwork: Artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onTogglePublish={handleTogglePublish}
              onDelete={setConfirmDelete}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete artwork?"
        description={`"${confirmDelete?.title}" will be permanently deleted. This cannot be undone.`}
      >
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Delete artwork
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// Artwork Card
function ArtworkCard({
  artwork,
  onTogglePublish,
  onDelete,
  isUpdating,
}: {
  artwork: Artwork
  onTogglePublish: (a: Artwork) => void
  onDelete: (a: Artwork) => void
  isUpdating: boolean
}) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-200">
      {/* Image */}
      <div className="overflow-hidden relative bg-stone-100">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full object-contain max-h-64 transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/default-artwork.jpg'
          }}
        />
        {/* Status badge */}
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded-lg text-xs font-medium shadow-sm ${
            artwork.isPublished
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {artwork.isPublished ? 'Published' : 'Draft'}
        </span>
        {/* Quick view link */}
        <Link
          to={`/artwork/${artwork.id}`}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <span className="bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
            Quick View
          </span>
        </Link>
      </div>

      {/* Info */}
      <div className="p-4">
        <div>
          <h3 className="font-semibold text-stone-800 leading-tight hover:text-gallery-600 transition-colors">
            <Link to={`/artwork/${artwork.id}`}>{artwork.title}</Link>
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
            <span>{artwork.artworkType}</span>
            {artwork.year && (
              <>
                <span>•</span>
                <span>{artwork.year}</span>
              </>
            )}
            {artwork.price != null && (
              <>
                <span>•</span>
                <span className="font-medium text-stone-700">{formatPrice(artwork.price)}</span>
              </>
            )}
          </div>
          {artwork.description && (
            <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">{artwork.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-stone-100">
          <button
            onClick={() => onTogglePublish(artwork)}
            disabled={isUpdating}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              artwork.isPublished
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            } disabled:opacity-50`}
          >
            {artwork.isPublished ? (
              <EyeIcon className="h-3.5 w-3.5" />
            ) : (
              <EyeSlashIcon className="h-3.5 w-3.5" />
            )}
            <span>{artwork.isPublished ? 'Published' : 'Draft'}</span>
          </button>

          <div className="flex-1" />

          <Link
            to={`${ROUTES.DASHBOARD_UPLOAD}?edit=${artwork.id}`}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Edit artwork"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </Link>

          <button
            onClick={() => onDelete(artwork)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete artwork"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 mb-4 rounded-full bg-stone-100 flex items-center justify-center">
        <PhotoIcon className="h-10 w-10 text-stone-300" />
      </div>
      <h3 className="text-lg font-semibold text-stone-700 mb-1">No artworks yet</h3>
      <p className="text-sm text-stone-500 mb-6">Upload your first piece to get started</p>
      <Link to={ROUTES.DASHBOARD_UPLOAD}>
        <Button leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}>
          Upload artwork
        </Button>
      </Link>
    </div>
  )
}