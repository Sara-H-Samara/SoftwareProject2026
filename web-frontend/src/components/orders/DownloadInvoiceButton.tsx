import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import api from '@/api/axiosInstance';
import toast from 'react-hot-toast';

interface DownloadInvoiceButtonProps {
  orderId: string;
}

export default function DownloadInvoiceButton({ orderId }: DownloadInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

    } catch {
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                 bg-gallery-600 text-white hover:bg-gallery-700
                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <DocumentArrowDownIcon className="w-4 h-4" />
      )}
      View Invoice
    </button>
  );
}