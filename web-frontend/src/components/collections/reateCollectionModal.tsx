import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useCreateCollection } from '@/hooks/useCollections';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCollectionModal({ isOpen, onClose, onSuccess }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const { mutate: createCollection, isPending } = useCreateCollection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCollection(
      { name: name.trim(), description: description.trim() || undefined, isPublic },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setIsPublic(true);
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800">Create New Collection</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 transition-colors">
            <XMarkIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Favorites, Summer Vibes"
            required
            autoFocus
          />
          
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gallery-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-gallery-600 focus:ring-gallery-500"
            />
            <label htmlFor="isPublic" className="text-sm text-stone-700">
              Make collection public
            </label>
          </div>
          <p className="text-xs text-stone-500 -mt-2 ml-6">
            Public collections can be viewed by anyone. Private collections are only visible to you.
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isPending} className="flex-1">
              Create Collection
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}