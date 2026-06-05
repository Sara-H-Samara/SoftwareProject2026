import { useState } from 'react';
import { PlusIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { useMyCollections, useDeleteCollection } from '@/hooks/useCollections';
import { SkeletonGrid } from '@/components/common/SkeletonGrid';
import Button from '@/components/common/Button';
import CollectionCard from '@/components/collections/CollectionCard';
import CreateCollectionModal from '@/components/collections/CreateCollectionModal';

export default function CollectionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: collections, isLoading } = useMyCollections();
  const { mutate: deleteCollection } = useDeleteCollection();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-6" />
          <SkeletonGrid count={6} variant="gallery" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">My Collections</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {collections?.length || 0} {collections?.length === 1 ? 'collection' : 'collections'} saved
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            New Collection
          </Button>
        </div>

        {/* Collections Grid */}
        {!collections || collections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <FolderPlusIcon className="w-10 h-10 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No collections yet</h3>
            <p className="text-stone-500 text-sm mb-6">Create your first collection to save your favorite artworks</p>
            <Button onClick={() => setIsModalOpen(true)} leftIcon={<PlusIcon className="w-4 h-4" />}>
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onDelete={() => {
                  if (confirm(`Delete "${collection.name}"? This cannot be undone.`)) {
                    deleteCollection(collection.id);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateCollectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            // Refresh collections
          }}
        />
      </div>
    </div>
  );
}