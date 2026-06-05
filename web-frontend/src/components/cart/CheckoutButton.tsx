import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import Button from '@/components/common/Button';
import api from '@/api/axiosInstance';
import toast from 'react-hot-toast';

export default function CheckoutButton() {
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to checkout');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/orders/create-checkout-session', {
        items: items.map(item => ({
          artworkId: item.artworkId,
          title: item.title,
          imageUrl: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
        })),
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/cart`,
      });

      sessionStorage.setItem('pendingOrder', JSON.stringify({
        items,
        totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      }));

      window.location.href = response.data.url;

    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Checkout failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} isLoading={isLoading} className="w-full">
      Checkout with Stripe
    </Button>
  );
}
