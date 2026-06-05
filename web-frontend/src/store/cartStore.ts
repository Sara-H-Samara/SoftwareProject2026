import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '@/types'
import { useAuthStore } from './authStore'

interface CartStore extends Cart {
  userId: string | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (artworkId: string) => void
  updateQuantity: (artworkId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  syncWithUser: () => void
}

const calcTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((s, i) => s + i.quantity, 0),
  totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
})

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      userId: null,

      addItem: (item) => {
        const existing = get().items.find(i => i.artworkId === item.artworkId)
        const newItems = existing
          ? get().items.map(i => i.artworkId === item.artworkId ? { ...i, quantity: i.quantity + 1 } : i)
          : [...get().items, { ...item, quantity: 1 }]
        set({ items: newItems, ...calcTotals(newItems) })
      },

      removeItem: (artworkId) => {
        const newItems = get().items.filter(i => i.artworkId !== artworkId)
        set({ items: newItems, ...calcTotals(newItems) })
      },

      updateQuantity: (artworkId, quantity) => {
        if (quantity <= 0) { get().removeItem(artworkId); return }
        const newItems = get().items.map(i => i.artworkId === artworkId ? { ...i, quantity } : i)
        set({ items: newItems, ...calcTotals(newItems) })
      },

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      getItemCount: () => get().totalItems,

      syncWithUser: () => {
        const currentUserId = useAuthStore.getState().user?.id ?? null

        if (currentUserId !== get().userId) {
          set({ items: [], totalItems: 0, totalPrice: 0, userId: currentUserId })
        }
      },
    }),
    { name: 'cart-storage' }
  )
)