// src/pages/CheckoutPage.tsx
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/helpers';
import CheckoutButton from '@/components/cart/CheckoutButton';
import { Link } from 'react-router-dom';

export default function CheckoutPage() {
  const { items, totalPrice } = useCartStore();

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-stone-800 mb-6">Checkout</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-stone-800 mb-4">Order Summary</h2>
          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.artworkId} className="flex justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">{item.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {item.artistName} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-stone-700">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 pt-3 border-t border-stone-200 font-semibold">
            <span className="text-stone-800">Total</span>
            <span className="text-gallery-600 text-lg">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        <CheckoutButton />

        <Link to="/cart" className="block text-center text-sm text-stone-500 mt-4 hover:text-stone-700">
          ← Back to Cart
        </Link>
      </div>
    </div>
  );
}