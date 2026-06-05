import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowDownIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useOrder } from '@/hooks/useOrders';
import { formatPrice, formatDate } from '@/utils/helpers';
import DownloadInvoiceButton from '@/components/orders/DownloadInvoiceButton';

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-stone-200 rounded" />
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <div className="h-8 w-48 bg-stone-200 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 bg-stone-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-stone-200 rounded mb-2" />
                      <div className="h-3 w-24 bg-stone-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <DocumentArrowDownIcon className="w-8 h-8 text-stone-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Order not found</h1>
            <p className="text-stone-500 mb-6">The order you're looking for doesn't exist.</p>
            <Link to="/orders" className="inline-flex items-center gap-2 text-gallery-600 hover:text-gallery-700 font-medium">
              ← Back to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back button */}
        <Link 
          to="/orders" 
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors group"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Orders
        </Link>

        {/* Order Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl font-bold text-stone-800">Order Details</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <TagIcon className="w-4 h-4" />
                    <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              <DownloadInvoiceButton orderId={order.id} />
            </div>
          </div>

          {/* Items */}
          <div className="p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Items in your order</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={item.id} className={`flex gap-4 pb-4 ${idx !== order.items.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-artwork.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <Link 
                      to={`/artwork/${item.artworkId}`} 
                      className="font-medium text-stone-800 hover:text-gallery-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-stone-500 mt-0.5">by {item.artistName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-stone-400">Quantity: {item.quantity}</span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-500">${item.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  <p className="font-semibold text-stone-700">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center py-2">
                <span className="text-stone-600">Subtotal</span>
                <span className="text-stone-700">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-stone-600">Shipping</span>
                <span className="text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-stone-200">
                <span className="text-lg font-semibold text-stone-800">Total</span>
                <span className="text-xl font-bold text-gallery-600">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
            <p className="text-xs text-stone-500 text-center">
              Thank you for supporting the arts! Your purchase helps artists thrive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}