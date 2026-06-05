// src/components/gallery-studio-pro/FurnitureEditor.tsx
import { useState } from 'react';
import { useGalleryDesignStore } from '@/store/galleryDesignStore';
import { PlusIcon, TrashIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

const FURNITURE_CATEGORIES = [
  { id: 'seating', name: 'Seating', items: [
    { id: 'bench', name: 'Bench', icon: '🪑', modelUrl: '/models/bench.glb' },
    { id: 'chair', name: 'Chair', icon: '🪑', modelUrl: '/models/chair.glb' },
    { id: 'stool', name: 'Stool', icon: '🪑', modelUrl: '/models/stool.glb' },
  ]},
  { id: 'display', name: 'Display', items: [
    { id: 'pedestal', name: 'Pedestal', icon: '🗿', modelUrl: '/models/pedestal.glb' },
    { id: 'display_case', name: 'Display Case', icon: '📦', modelUrl: '/models/display_case.glb' },
    { id: 'podium', name: 'Podium', icon: '🎤', modelUrl: '/models/podium.glb' },
  ]},
  { id: 'decor', name: 'Decor', items: [
    { id: 'plant', name: 'Plant', icon: '🌿', modelUrl: '/models/plant.glb' },
    { id: 'sculpture', name: 'Sculpture', icon: '🗿', modelUrl: '/models/sculpture.glb' },
    { id: 'vase', name: 'Vase', icon: '🏺', modelUrl: '/models/vase.glb' },
    { id: 'bookshelf', name: 'Bookshelf', icon: '📚', modelUrl: '/models/bookshelf.glb' },
  ]},
  { id: 'tables', name: 'Tables', items: [
    { id: 'table', name: 'Table', icon: '🪑', modelUrl: '/models/table.glb' },
    { id: 'coffee_table', name: 'Coffee Table', icon: '☕', modelUrl: '/models/coffee_table.glb' },
  ]},
];

const WALL_POSITIONS = [
  { id: 'front', name: 'Front Wall', x: 0, y: 0, z: -9.5 },
  { id: 'back', name: 'Back Wall', x: 0, y: 0, z: 9.5 },
  { id: 'left', name: 'Left Wall', x: -9.5, y: 0, z: 0 },
  { id: 'right', name: 'Right Wall', x: 9.5, y: 0, z: 0 },
  { id: 'center', name: 'Center Room', x: 0, y: 0, z: 0 },
];

export default function FurnitureEditor() {
  const { customization, updatePart } = useGalleryDesignStore();
  const furniture = customization.furniture || [];
  const [selectedCategory, setSelectedCategory] = useState('seating');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0, z: 0, rotation: 0 });

  const addFurniture = (type: string, modelUrl: string) => {
    const newItem = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      modelUrl,
      position: { x: previewPosition.x, y: previewPosition.y, z: previewPosition.z },
      rotation: previewPosition.rotation,
      scale: 1,
    };
    updatePart('furniture', [...furniture, newItem]);
    setSelectedItem(null);
  };

  const removeFurniture = (id: string) => {
    updatePart('furniture', furniture.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {FURNITURE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all
              ${selectedCategory === cat.id 
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                : 'text-stone-500 hover:text-stone-700'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Furniture Items Grid */}
      <div className="grid grid-cols-3 gap-2">
        {FURNITURE_CATEGORIES.find(c => c.id === selectedCategory)?.items.map(item => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item.id)}
            className={`p-3 rounded-xl border-2 transition-all text-center
              ${selectedItem === item.id 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-stone-200 hover:border-stone-300'
              }`}
          >
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-xs font-medium">{item.name}</div>
          </button>
        ))}
      </div>

      {/* Position Preview */}
      {selectedItem && (
        <div className="border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-stone-700">Position Preview</label>
            <button
              onClick={() => {
                const item = FURNITURE_CATEGORIES.flatMap(c => c.items).find(i => i.id === selectedItem);
                if (item) addFurniture(item.id, item.modelUrl);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <PlusIcon className="w-4 h-4 inline mr-1" />
              Place in Gallery
            </button>
          </div>

          {/* Wall Position Selector */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {WALL_POSITIONS.map(pos => (
              <button
                key={pos.id}
                onClick={() => setPreviewPosition({ ...previewPosition, x: pos.x, y: pos.y, z: pos.z })}
                className={`p-2 rounded-lg text-sm border transition-all
                  ${previewPosition.x === pos.x && previewPosition.z === pos.z
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-stone-200 hover:border-stone-300'
                  }`}
              >
                {pos.name}
              </button>
            ))}
          </div>

          {/* Y Position (Height) */}
          <div className="mb-3">
            <label className="text-xs text-stone-500 block mb-1">Height (Y position)</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={previewPosition.y}
              onChange={(e) => setPreviewPosition({ ...previewPosition, y: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-right text-xs text-stone-400">{previewPosition.y.toFixed(1)}m</div>
          </div>

          {/* Rotation */}
          <div className="mb-3">
            <label className="text-xs text-stone-500 block mb-1">Rotation ({previewPosition.rotation}°)</label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={previewPosition.rotation}
              onChange={(e) => setPreviewPosition({ ...previewPosition, rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500">
            🖼️ Position: X={previewPosition.x}, Y={previewPosition.y.toFixed(1)}m, Z={previewPosition.z}, Rotation={previewPosition.rotation}°
          </div>
        </div>
      )}

      {/* Placed Furniture List */}
      {furniture.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <label className="text-sm font-medium text-stone-700 block mb-2">
            Placed Items ({furniture.length})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {furniture.map(item => {
              const itemInfo = FURNITURE_CATEGORIES.flatMap(c => c.items).find(i => i.id === item.type);
              return (
                <div key={item.id} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{itemInfo?.icon || '🪑'}</span>
                    <div>
                      <div className="text-sm font-medium">{itemInfo?.name || item.type}</div>
                      <div className="text-xs text-stone-400">
                        Pos: ({item.position.x}, {item.position.z}) • Y: {item.position.y.toFixed(1)}m • Rot: {item.rotation}°
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setPreviewPosition({
                          x: item.position.x,
                          y: item.position.y,
                          z: item.position.z,
                          rotation: item.rotation
                        });
                        setSelectedItem(item.type);
                      }} 
                      className="p-1 text-stone-400 hover:text-purple-600"
                    >
                      <ArrowsPointingOutIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeFurniture(item.id)} className="p-1 text-stone-400 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
        💡 Tip: Furniture appears in your 3D gallery. You can reposition items later.
      </div>
    </div>
  );
}