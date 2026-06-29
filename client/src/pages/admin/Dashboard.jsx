import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [dateFilter, setDateFilter] = useState('month');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboard', dateFilter],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard', {
        params: { dateFilter },
      });
      return response.data.data;
    },
  });

  const stats = [
    {
      name: 'និស្សិតសរុប',
      value: dashboardData?.totalStudents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'ទឹកប្រាក់ទទួលបានសរុប',
      value: formatCurrency(dashboardData?.totalCollected || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase',
    },
    {
      name: 'ទឹកប្រាក់រង់ចាំបង់',
      value: formatCurrency(dashboardData?.pendingFees || 0),
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'decrease',
    },
    {
      name: 'អត្រាទទួលបាន',
      value: `${dashboardData?.collectionRate || 0}%`,
      icon: CheckCircleIcon,
      color: 'bg-primary-500',
      change: '+3%',
      changeType: 'increase',
    },
  ];

  // Monthly collection chart data
  const collectionChartData = {
    labels: [
      'មករា',
      'កុម្ភៈ',
      'មីនា',
      'មេសា',
      'ឧសភា',
      'មិថុនា',
      'កក្កដា',
      'សីហា',
      'កញ្ញា',
      'តុលា',
      'វិច្ឆិកា',
      'ធ្នូ',
    ],
    datasets: [
      {
        label: 'ការប្រមូលប្រាក់',
        data: dashboardData?.monthlyCollections || [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Fee breakdown doughnut chart
  const feeBreakdownData = {
    labels: dashboardData?.feeBreakdown?.map((f) => f.name) || [
      'ថ្លៃបង្រៀន',
      'មន្ទីរពិសោធន៍',
      'បណ្ណាល័យ',
      'កីឡា',
    ],
    datasets: [
      {
        data: dashboardData?.feeBreakdown?.map((f) => f.amount) || [
          60, 20, 10, 10,
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Payment methods bar chart
  const paymentMethodsData = {
    labels: ['តាមអ៊ីនធឺណិត', 'សាច់ប្រាក់', 'ផ្ទេរតាមធនាគារ', 'មូលប្បទានប័ត្រ'],
    datasets: [
      {
        label: 'ការបង់ប្រាក់',
        data: dashboardData?.paymentMethods || [65, 20, 10, 5],
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ផ្ទាំងគ្រប់គ្រង</h1>
          <p className="text-gray-600">សូមស្វាគមន៍ត្រឡប់មកវិញ! នេះជាទិដ្ឋភាពទូទៅរបស់អ្នក</p>
        </div>
        <div className="flex gap-3">
          <select
            className="input w-auto"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">ថ្ងៃនេះ</option>
            <option value="week">សប្តាហ៍នេះ</option>
            <option value="month">ខែនេះ</option>
            <option value="year">ឆ្នាំនេះ</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stat.changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={
                  stat.changeType === 'increase'
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {stat.change}
              </span>
              <span className="text-gray-500 ml-1">ធៀបនឹងខែមុន</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Trend Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            និន្នាការនៃការប្រមូលប្រាក់
          </h3>
          <div className="h-80">
            <Line
              data={collectionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Fee Breakdown Doughnut */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ចំណាត់ថ្នាក់ថ្លៃសិក្សា
          </h3>
          <div className="h-64">
            <Doughnut
              data={feeBreakdownData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
                cutout: '60%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            វិធីសាស្ត្របង់ប្រាក់
          </h3>
          <div className="h-64">
            <Bar
              data={paymentMethodsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ប្រតិបត្តិការថ្មីៗ
            </h3>
            <a
              href="/admin/payments"
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              មើលទាំងអស់
            </a>
          </div>
          <div className="space-y-4">
            {(dashboardData?.recentPayments || [])
              .slice(0, 5)
              .map((payment, index) => (
                <div
                  key={payment.id || index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'completed'
                          ? 'bg-green-100'
                          : 'bg-yellow-100'
                        }`}
                    >
                      {payment.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.student?.user?.firstName}{' '}
                        {payment.student?.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.receiptNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </p>
                  </div>
                </div>
              ))}
            {(!dashboardData?.recentPayments ||
              dashboardData.recentPayments.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  គ្មានប្រតិបត្តិការថ្មីៗនេះទេ
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="card bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">សកម្មភាពដែលត្រូវធ្វើ</h3>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>
                • និស្សិតចំនួន {dashboardData?.overduePayments || 0} នាក់ មានការបង់ប្រាក់ហួសកាលកំណត់
              </li>
              <li>
                • ការបង់ប្រាក់ចំនួន {dashboardData?.pendingApprovals || 0} រង់ចាំការអនុម័ត
              </li>
              <li>• អ៊ីមែលរំលឹកការបង់ប្រាក់ត្រូវបានកំណត់សម្រាប់ថ្ងៃស្អែក</li>
            </ul>
          </div>
          <button className="text-yellow-700 hover:text-yellow-900 font-medium text-sm">
            មើលព័ត៌មានលម្អិត →
          </button>
        </div>
      </div>
    </div>
  );
}
