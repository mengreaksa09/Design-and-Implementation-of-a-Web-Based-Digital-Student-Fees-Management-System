import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['paymentHistory', searchTerm, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (yearFilter) params.append('year', yearFilter);
      const response = await api.get(`/students/payments?${params}`);
      return response.data.data;
    },
  });

  const downloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const getMethodLabel = (method) => {
    const labels = {
      online: 'Online Payment',
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600">
          View all your past payments and download receipts
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.count || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data?.summary?.totalAmount || 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">This Year</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(data?.summary?.thisYear || 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by fee type or transaction ID..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {data?.payments?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No payment history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.payments?.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {payment.FeeAssignment?.FeeStructure?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Transaction ID: {payment.transactionId}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        {formatDate(payment.createdAt)}
                      </span>
                      <span className="text-gray-600">
                        {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  <button
                    onClick={() => downloadReceipt(payment.id)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                    title="Download Receipt"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Timeline (Optional Visual) */}
      {data?.payments?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {data?.payments?.slice(0, 5).map((payment, index) => (
                <div key={payment.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </p>
                    <p className="font-medium text-gray-900">
                      {payment.FeeAssignment?.FeeStructure?.name}
                    </p>
                    <p className="text-sm text-green-600 font-semibold">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
