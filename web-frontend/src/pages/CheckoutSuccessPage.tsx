import { useEffect, useState } from 'react';
import { Link} from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '@/api/axiosInstance';

export default function CheckoutSuccessPage() {
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createOrder = async () => {
      const pendingOrder = sessionStorage.getItem('pendingOrder');
      
      if (!pendingOrder) {
        setIsCreatingOrder(false);
        return;
      }

      try {
        const { items, totalAmount } = JSON.parse(pendingOrder);
        
        await api.post('/api/orders', {
          items: items.map((item: any) => ({
            artworkId: item.artworkId,
            title: item.title,
            imageUrl: item.imageUrl,
            artistName: item.artistName,
            price: item.price,
            quantity: item.quantity,
          })),
          totalAmount,
        });
        
        // Clear pending order and cart
        sessionStorage.removeItem('pendingOrder');
        
      } catch (err) {
        console.error('Failed to create order:', err);
        setError('Order created but failed to save. Please contact support.');
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, []);

  if (isCreatingOrder) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gallery-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-stone-800">Processing your order...</h2>
            <p className="text-stone-500 mt-2">Please wait while we save your order.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Payment Successful!</h1>
          <p className="text-stone-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          {error && (
            <p className="text-yellow-600 text-sm mb-4">{error}</p>
          )}
          <div className="space-y-3">
            <Link to="/orders" className="block text-gallery-600 hover:text-gallery-700">
              View Order History →
            </Link>
            <Link to="/browse" className="block text-stone-500 hover:text-stone-600 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}