import { Link } from 'react-router-dom';
import { ShoppingBagIcon, ArrowLeftIcon, EyeIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useOrders } from '@/hooks/useOrders';
import { formatPrice, formatDate } from '@/utils/helpers';

export default function OrderHistoryPage() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-stone-200 rounded" />
            <div className="h-8 w-48 bg-stone-200 rounded" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-stone-200 rounded" />
                    <div className="h-3 w-24 bg-stone-200 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-stone-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-10 h-10 text-stone-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">No orders yet</h1>
            <p className="text-stone-500 mb-6">You haven't placed any orders.</p>
            <Link to="/browse" className="inline-flex items-center gap-2 text-gallery-600 hover:text-gallery-700 font-medium">
              Browse artworks →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors group">
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Order History</h1>
          <p className="text-sm text-stone-500 mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="p-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-stone-500">
                      <TagIcon className="w-4 h-4" />
                      <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-stone-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                    </span>
                    <p className="font-semibold text-stone-800">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-4">
                <div className="space-y-3">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={item.id} className={`flex gap-3 ${idx === 0 ? '' : 'pt-3 border-t border-stone-100'}`}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-artwork.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <Link 
                          to={`/artwork/${item.artworkId}`} 
                          className="font-medium text-stone-800 hover:text-gallery-600 transition-colors text-sm"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-stone-500 mt-0.5">by {item.artistName}</p>
                        <p className="text-xs text-stone-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-stone-700">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-stone-400 text-center pt-2">
                      + {order.items.length - 2} more {order.items.length - 2 === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-gallery-600 hover:text-gallery-700 font-medium group"
                >
                  <EyeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  View Order Details
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}