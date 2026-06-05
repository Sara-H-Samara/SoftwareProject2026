import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, GlobeAltIcon, LockClosedIcon, PencilIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useCollection, useDeleteCollection, useRemoveFromCollection } from '@/hooks/useCollections';
import { PageLoader } from '@/components/common/Spinner';
import Button from '@/components/common/Button';
import ArtworkCard from '@/components/search/ArtworkCard';
import { formatDate } from '@/utils/helpers';

export default function CollectionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: collection, isLoading } = useCollection(id!);
  const { mutate: deleteCollection } = useDeleteCollection();
  const { mutate: removeFromCollection } = useRemoveFromCollection();

  if (isLoading) return <PageLoader message="Loading collection..." />;

  if (!collection) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Collection not found</h1>
          <Link to="/collections" className="text-gallery-600 hover:text-gallery-700">
            ← Back to collections
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm(`Delete "${collection.name}"? This cannot be undone.`)) {
      deleteCollection(collection.id);
      navigate('/collections');
    }
  };

  const handleRemoveItem = (artworkId: string, artworkTitle: string) => {
    if (confirm(`Remove "${artworkTitle}" from this collection?`)) {
      removeFromCollection({ collectionId: collection.id, artworkId });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back button */}
        <Link to="/collections" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Collections
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-stone-800">{collection.name}</h1>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                  collection.isPublic ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                }`}>
                  {collection.isPublic ? <GlobeAltIcon className="w-3 h-3" /> : <LockClosedIcon className="w-3 h-3" />}
                  {collection.isPublic ? 'Public' : 'Private'}
                </div>
              </div>
              {collection.description && (
                <p className="text-stone-600 mb-2">{collection.description}</p>
              )}
              <p className="text-xs text-stone-400">
                Created {formatDate(collection.createdAt)} · {collection.itemCount} items
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leftIcon={<PencilIcon className="w-4 h-4" />}>
                Edit
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<ShareIcon className="w-4 h-4" />}>
                Share
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} leftIcon={<TrashIcon className="w-4 h-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {collection.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
            <p className="text-stone-500">No artworks in this collection yet</p>
            <Link to="/browse" className="text-gallery-600 text-sm mt-2 inline-block">
              Browse galleries →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {collection.items.map((item) => (
              <div key={item.id} className="relative group">
                <ArtworkCard artwork={item as any} />
                <button
                  onClick={() => handleRemoveItem(item.artworkId, item.title)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}