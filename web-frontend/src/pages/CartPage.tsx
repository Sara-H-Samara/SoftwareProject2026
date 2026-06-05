import { Link} from 'react-router-dom';
import { TrashIcon, PlusIcon, MinusIcon, ArrowLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/helpers';
import { useAuthStore } from '@/store/authStore';
import CheckoutButton from '@/components/cart/CheckoutButton';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-8 h-8 text-stone-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Shopping Cart</h1>
            <p className="text-stone-500 mb-6">Please login to view your cart</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-gallery-600 hover:text-gallery-700 font-medium">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-8 h-8 text-stone-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Your cart is empty</h1>
            <p className="text-stone-500 mb-6">Looks like you haven't added any artworks yet.</p>
            <Link to="/browse" className="inline-flex items-center gap-2 text-gallery-600 hover:text-gallery-700 font-medium">
              Browse galleries →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/browse"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-stone-800">Shopping Cart</h1>
          <span className="text-sm text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.artworkId} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover bg-stone-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-artwork.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <Link to={`/artwork/${item.artworkId}`} className="hover:text-gallery-600 transition-colors">
                      <h3 className="font-semibold text-stone-800">{item.title}</h3>
                    </Link>
                    <p className="text-sm text-stone-500 mt-0.5">{item.artistName}</p>
                    <p className="text-sm font-medium text-stone-700 mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.artworkId, item.quantity - 1)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-stone-700">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.artworkId, item.quantity + 1)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.artworkId)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                      aria-label="Remove item"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 h-fit sticky top-24">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal ({totalItems} items)</span>
                <span className="text-stone-700 font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="border-t border-stone-100 my-2" />
              <div className="flex justify-between">
                <span className="text-stone-800 font-semibold">Total</span>
                <span className="text-gallery-600 text-xl font-bold">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <CheckoutButton />
            
            <button
              onClick={clearCart}
              className="w-full text-center text-sm text-stone-400 hover:text-red-500 mt-3 transition-colors py-2"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}