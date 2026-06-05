import { useState } from 'react';
import { DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '@/api/axiosInstance';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface ExportButtonsProps {
  months: number;
}

export default function ExportButtons({ months }: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const response = await api.get(
        `/api/artworks/analytics/export/csv?months=${months}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/csv' });
      saveAs(blob, `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      // ✅ toast بدل alert()
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const exportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const response = await api.get(
        `/api/artworks/analytics/export/pdf?months=${months}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      // ✅ toast بدل alert()
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCSV}
        disabled={isExportingCSV}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50"
      >
        {isExportingCSV ? (
          <div className="w-4 h-4 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <DocumentTextIcon className="w-4 h-4" />
        )}
        CSV
      </button>

      <button
        onClick={exportPDF}
        disabled={isExportingPDF}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50"
      >
        {isExportingPDF ? (
          <div className="w-4 h-4 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <DocumentArrowDownIcon className="w-4 h-4" />
        )}
        PDF
      </button>
    </div>
  );
}