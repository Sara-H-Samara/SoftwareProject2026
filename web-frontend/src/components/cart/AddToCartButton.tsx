import { useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import toast from 'react-hot-toast';

interface AddToCartButtonProps {
  artworkId: string;
  title: string;
  imageUrl: string;
  artistName: string;
  price: number;
  variant?: 'default' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export default function AddToCartButton({
  artworkId,
  title,
  imageUrl,
  artistName,
  price,
  variant = 'default',
  size = 'md',
}: AddToCartButtonProps) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      navigate(ROUTES.LOGIN);
      return;
    }

    addItem({ artworkId, title, imageUrl, artistName, price });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    default: 'bg-gallery-600 text-white hover:bg-gallery-700',
    outline: 'border border-gallery-600 text-gallery-600 hover:bg-gallery-50',
    icon: 'p-1.5 rounded-full bg-gallery-600 text-white hover:bg-gallery-700',
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleAddToCart}
          className={`${variantClasses[variant]} transition-colors`}
          aria-label="Add to cart"
        >
          <ShoppingCartIcon className="w-4 h-4" />
        </button>
        {showSuccess && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap">
            Added!
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className={`flex items-center gap-2 rounded-lg font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      <ShoppingCartIcon className="w-4 h-4" />
      {showSuccess ? 'Added!' : 'Add to Cart'}
    </button>
  );
}
