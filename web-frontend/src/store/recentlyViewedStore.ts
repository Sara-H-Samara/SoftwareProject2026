import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedItem {
  id: string;
  title: string;
  imageUrl: string;
  artistName: string;
  artistId: string;
  viewedAt: number;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  getRecentItems: (limit?: number) => RecentlyViewedItem[];
}

const MAX_ITEMS = 12;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const currentItems = get().items;
        
        // Remove if already exists
        const filtered = currentItems.filter(i => i.id !== item.id);
        
        // Add new item at the beginning
        const newItem = { ...item, viewedAt: Date.now() };
        const newItems = [newItem, ...filtered];
        
        // Limit to MAX_ITEMS
        const limited = newItems.slice(0, MAX_ITEMS);
        
        set({ items: limited });
      },

      removeItem: (id) => {
        const currentItems = get().items;
        set({ items: currentItems.filter(i => i.id !== id) });
      },

      clearAll: () => {
        set({ items: [] });
      },

      getRecentItems: (limit = 6) => {
        return get().items.slice(0, limit);
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);