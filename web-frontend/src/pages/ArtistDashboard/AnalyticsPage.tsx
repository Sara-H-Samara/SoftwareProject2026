import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axiosInstance';
import { PageLoader } from '@/components/common/Spinner';
import { formatPrice } from '@/utils/helpers';
import ExportButtons from '@/components/analytics/ExportButtons';

interface AnalyticsSummary {
  totalArtworks: number;
  totalLikes: number;
  totalReviews: number;
  totalFollowers: number;
  averageRating: number;
  totalSales: number;
  totalOrders: number;
}

interface SalesData {
  month: string;
  total: number;
}

interface InteractionsData {
  month: string;
  likes: number;
  comments: number;
  views: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);
  
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get<AnalyticsSummary>('/api/artworks/analytics/summary');
      return res.data;
    },
  });
  
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales', months],
    queryFn: async () => {
      const res = await api.get<SalesData[]>(`/api/artworks/analytics/sales?months=${months}`);
      return res.data;
    },
  });
  
  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['analytics-interactions', months],
    queryFn: async () => {
      const res = await api.get<InteractionsData[]>(`/api/artworks/analytics/interactions?months=${months}`);
      return res.data;
    },
  });
  
  if (summaryLoading || salesLoading || interactionsLoading) {
    return <PageLoader message="Loading analytics..." />;
  }
  
  const pieData = [
    { name: 'Artworks', value: summary?.totalArtworks || 0 },
    { name: 'Likes', value: summary?.totalLikes || 0 },
    { name: 'Reviews', value: summary?.totalReviews || 0 },
    { name: 'Followers', value: summary?.totalFollowers || 0 },
  ];
  
  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-8">
      {/* Header with Export Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Analytics Dashboard</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Track your gallery performance and audience engagement
          </p>
        </div>
        <ExportButtons months={months} />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Artworks"
          value={summary?.totalArtworks || 0}
          icon="🎨"
        />
        <StatCard
          title="Total Likes"
          value={summary?.totalLikes || 0}
          icon="❤️"
        />
        <StatCard
          title="Followers"
          value={summary?.totalFollowers || 0}
          icon="👥"
        />
        <StatCard
          title="Total Sales"
          value={formatPrice(summary?.totalSales || 0)}
          icon="💰"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">Sales Overview</h2>
            <div className="flex items-center gap-3">
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-gallery-500"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => [formatPrice(value), 'Sales']}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Interactions Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Engagement</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={interactions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="views" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Card */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Average Rating</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-amber-500">
                {summary?.averageRating.toFixed(1) || '0'}
              </div>
              <div className="flex items-center gap-1 mt-2 justify-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.round(summary?.averageRating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-stone-500 mt-2">
                Based on {summary?.totalReviews || 0} reviews
              </p>
            </div>
          </div>
        </div>
        
        {/* Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => {
                  const percent = totalValue > 0 ? ((value / totalValue) * 100).toFixed(0) : '0';
                  return `${name}: ${percent}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => [value, 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Orders Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-stone-100">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">Order Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-stone-50 rounded-xl">
            <p className="text-3xl font-bold text-gallery-600">{summary?.totalOrders || 0}</p>
            <p className="text-sm text-stone-500 mt-1">Total Orders</p>
          </div>
          <div className="text-center p-6 bg-stone-50 rounded-xl">
            <p className="text-3xl font-bold text-emerald-600">{formatPrice(summary?.totalSales || 0)}</p>
            <p className="text-sm text-stone-500 mt-1">Total Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-stone-100 border-l-4 border-l-gallery-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}