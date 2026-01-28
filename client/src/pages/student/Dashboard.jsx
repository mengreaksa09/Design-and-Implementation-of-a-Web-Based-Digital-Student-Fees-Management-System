import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await api.get('/students/dashboard');
      return response.data.data;
    },
  });

  const stats = [
    {
      name: 'Total Fees',
      value: formatCurrency(dashboardData?.totalFees || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Paid Amount',
      value: formatCurrency(dashboardData?.paidAmount || 0),
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Amount',
      value: formatCurrency(dashboardData?.pendingAmount || 0),
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Overdue Amount',
      value: formatCurrency(dashboardData?.overdueAmount || 0),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-primary-100 mt-1">
              Here's an overview of your fee status
            </p>
          </div>
          <Link
            to="/student/pay"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Make Payment
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
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
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Fees */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Fees
            </h3>
            <Link
              to="/student/fees"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {dashboardData?.pendingFees?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">All fees are paid! Great job! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData?.pendingFees?.slice(0, 4).map((fee) => (
                <div
                  key={fee.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    new Date(fee.dueDate) < new Date()
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {fee.FeeStructure?.name}
                      </h4>
                      {new Date(fee.dueDate) < new Date() && (
                        <span className="badge badge-danger">Overdue</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Due: {formatDate(fee.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(fee.amount - (fee.paidAmount || 0))}
                    </p>
                    <Link
                      to={`/student/pay?feeId=${fee.id}`}
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      Pay Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity & Notifications */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <Link
                to="/student/notifications"
                className="text-primary-600 hover:text-primary-500"
              >
                <BellIcon className="h-5 w-5" />
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData?.notifications?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No new notifications
                </p>
              ) : (
                dashboardData?.notifications
                  ?.slice(0, 3)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.read ? 'bg-gray-300' : 'bg-primary-600'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Payments
              </h3>
              <Link
                to="/student/history"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData?.recentPayments?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No payments yet
                </p>
              ) : (
                dashboardData?.recentPayments?.slice(0, 3).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.FeeAssignment?.FeeStructure?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span className="badge badge-success text-xs">Paid</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/student/fees"
            className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">View Fees</p>
          </Link>
          <Link
            to="/student/pay"
            className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Make Payment</p>
          </Link>
          <Link
            to="/student/history"
            className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <ClockIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Payment History</p>
          </Link>
          <Link
            to="/student/profile"
            className="p-4 border rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <svg
              className="h-8 w-8 text-purple-600 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <p className="font-medium text-gray-900">My Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
