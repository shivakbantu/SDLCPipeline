import { useEffect, useState } from 'react';
import { analyticsService, PlatformStats } from '@/services/analyticsService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, Hotel, Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await analyticsService.getPlatformStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [120000, 190000, 150000, 250000, 220000, 300000],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform performance and metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hotels</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_hotels || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Hotel className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_bookings || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats?.total_revenue.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Active Bookings</p>
              <p className="text-xl font-bold text-blue-900 mt-1">{stats?.active_bookings || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending Hotels</p>
              <p className="text-xl font-bold text-yellow-900 mt-1">
                {stats?.pending_hotels || 0}
              </p>
            </div>
            <Hotel className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Open Disputes</p>
              <p className="text-xl font-bold text-red-900 mt-1">{stats?.open_disputes || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Platform Revenue</h2>
            <div className="flex items-center text-green-600">
              <TrendingUp className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">+{stats?.revenue_growth.toFixed(1)}%</span>
            </div>
          </div>
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/hotels"
              className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Review Pending Hotels</p>
                  <p className="text-sm text-gray-600">
                    {stats?.pending_hotels || 0} hotel{stats?.pending_hotels !== 1 ? 's' : ''}{' '}
                    awaiting approval
                  </p>
                </div>
                <Hotel className="w-6 h-6 text-yellow-600" />
              </div>
            </a>

            <a
              href="/disputes"
              className="block p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Resolve Disputes</p>
                  <p className="text-sm text-gray-600">
                    {stats?.open_disputes || 0} open dispute{stats?.open_disputes !== 1 ? 's' : ''}
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </a>

            <a
              href="/analytics"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">View Detailed Analytics</p>
                  <p className="text-sm text-gray-600">Explore comprehensive platform metrics</p>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
