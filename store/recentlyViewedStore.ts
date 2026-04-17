import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
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
        const filtered = get().items.filter((i) => i.id !== item.id);
        const newItem = { ...item, viewedAt: Date.now() };
        const newItems = [newItem, ...filtered].slice(0, MAX_ITEMS);
        set({ items: newItems });
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      clearAll: () => set({ items: [] }),
      getRecentItems: (limit = 6) => get().items.slice(0, limit),
    }),
    {
      name: "recently-viewed-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);