import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (artworkId: string) => void;
  updateQuantity: (artworkId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      addItem: (item) => {
        const current = get().items;
        const existing = current.find((i) => i.artworkId === item.artworkId);
        let newItems;
        if (existing) {
          newItems = current.map((i) =>
            i.artworkId === item.artworkId ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          newItems = [...current, { ...item, quantity: 1 }];
        }
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        set({ items: newItems, totalItems, totalPrice });
      },
      removeItem: (artworkId) => {
        const newItems = get().items.filter((i) => i.artworkId !== artworkId);
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        set({ items: newItems, totalItems, totalPrice });
      },
      updateQuantity: (artworkId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(artworkId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.artworkId === artworkId ? { ...i, quantity } : i
        );
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        set({ items: newItems, totalItems, totalPrice });
      },
      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);