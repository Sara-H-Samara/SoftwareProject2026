import { Link } from 'react-router-dom';
import { FolderIcon, GlobeAltIcon, LockClosedIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { Collection } from '@/types';
import { formatDate } from '@/utils/helpers';

interface CollectionCardProps {
  collection: Collection;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const previewItems = collection.items.slice(0, 4);

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-all">
      {/* Cover Image */}
      <Link to={`/collections/${collection.id}`} className="block">
        <div className="aspect-[16/9] overflow-hidden relative bg-stone-100">
          {collection.coverImageUrl ? (
            <img
              src={collection.coverImageUrl}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gallery-100 to-purple-100">
              <FolderIcon className="w-12 h-12 text-gallery-400" />
            </div>
          )}
          
          {/* Privacy Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm ${
              collection.isPublic 
                ? 'bg-black/50 text-white' 
                : 'bg-black/50 text-white'
            }`}>
              {collection.isPublic ? (
                <><GlobeAltIcon className="w-3 h-3" /> Public</>
              ) : (
                <><LockClosedIcon className="w-3 h-3" /> Private</>
              )}
            </div>
          </div>
          
          {/* Item Count Badge */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
              {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/collections/${collection.id}`}>
          <h3 className="font-semibold text-stone-800 hover:text-gallery-600 transition-colors line-clamp-1">
            {collection.name}
          </h3>
        </Link>
        
        {collection.description && (
          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{collection.description}</p>
        )}
        
        <p className="text-[10px] text-stone-400 mt-2">
          Created {formatDate(collection.createdAt)}
        </p>
        
        {/* Preview Thumbnails */}
        {previewItems.length > 0 && (
          <div className="flex -space-x-2 mt-3">
            {previewItems.map((item, idx) => (
              <div
                key={item.id}
                className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden"
                style={{ zIndex: previewItems.length - idx }}
              >
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {collection.itemCount > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">
                +{collection.itemCount - 4}
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-100">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-stone-400 hover:text-gallery-600 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}