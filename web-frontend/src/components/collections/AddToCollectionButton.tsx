import { useState } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { useMyCollections } from '@/hooks/useCollections';
import { useAddToCollection } from '@/hooks/useCollections';
import { useAuthStore } from '@/store/authStore';

interface AddToCollectionButtonProps {
  artworkId: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md';
}

export default function AddToCollectionButton({ artworkId, variant = 'icon', size = 'md' }: AddToCollectionButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const { data: collections, isLoading } = useMyCollections();
  const { mutate: addToCollection, isPending } = useAddToCollection();

  const handleAddToCollection = (collectionId: string) => {
    addToCollection({ collectionId, data: { artworkId } });
    setIsOpen(false);
  };

  if (!isAuthenticated) return null;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const buttonSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  if (variant === 'button') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors ${buttonSizes[size]}`}
        >
          <BookmarkIcon className={iconSizes[size]} />
          <span>Save to Collection</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-stone-100 z-50 overflow-hidden">
            <div className="p-2 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase">Save to Collection</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-stone-500">Loading...</div>
              ) : collections?.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-stone-500">No collections yet</p>
                  <button className="text-xs text-gallery-600 mt-1">Create one</button>
                </div>
              ) : (
                collections?.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                      <BookmarkIcon className="w-4 h-4 text-stone-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-700">{collection.name}</p>
                      <p className="text-xs text-stone-400">{collection.itemCount} items</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-stone-400 hover:text-gallery-600 hover:bg-stone-100 transition-colors"
        aria-label="Add to collection"
      >
        <BookmarkIcon className={iconSizes[size]} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-100 z-50 overflow-hidden">
            <div className="p-2 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase">Save to Collection</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-stone-500">Loading...</div>
              ) : collections?.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-stone-500">No collections yet</p>
                  <button className="text-xs text-gallery-600 mt-1">Create one</button>
                </div>
              ) : (
                collections?.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                      <BookmarkIcon className="w-4 h-4 text-stone-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-700">{collection.name}</p>
                      <p className="text-xs text-stone-400">{collection.itemCount} items</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}