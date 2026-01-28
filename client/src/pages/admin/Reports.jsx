import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['report', reportType, dateRange, selectedMonth, selectedYear],
    queryFn: async () => {
      let url = '/reports/';
      const params = new URLSearchParams();

      switch (reportType) {
        case 'daily':
          url += 'daily';
          params.append('date', dateRange.startDate);
          break;
        case 'monthly':
          url += 'monthly';
          params.append('month', selectedMonth);
          params.append('year', selectedYear);
          break;
        case 'yearly':
          url += 'yearly';
          params.append('year', selectedYear);
          break;
        case 'collection':
          url += 'collection';
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
          break;
      }

      const response = await api.get(`${url}?${params}`);
      return response.data.data;
    },
  });

  const exportReport = async (format) => {
    try {
      let url = `/reports/${reportType}/export?format=${format}`;
      const params = new URLSearchParams();

      switch (reportType) {
        case 'daily':
          params.append('date', dateRange.startDate);
          break;
        case 'monthly':
          params.append('month', selectedMonth);
          params.append('year', selectedYear);
          break;
        case 'yearly':
          params.append('year', selectedYear);
          break;
        case 'collection':
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
          break;
      }

      const response = await api.get(`${url}&${params}`, {
        responseType: 'blob',
      });

      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `${reportType}-report-${
        new Date().toISOString().split('T')[0]
      }.${extension}`;

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // Chart data for collection report
  const chartData = {
    labels: reportData?.chartLabels || [],
    datasets: [
      {
        label: 'Collections',
        data: reportData?.chartData || [],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export financial reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export Excel
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="btn-primary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'daily', label: 'Daily Report', icon: CalendarDaysIcon },
            { id: 'monthly', label: 'Monthly Report', icon: CalendarDaysIcon },
            { id: 'yearly', label: 'Yearly Report', icon: ChartBarIcon },
            {
              id: 'collection',
              label: 'Collection Report',
              icon: ChartBarIcon,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-4 pb-6 border-b">
          {reportType === 'daily' && (
            <div>
              <label className="label">Select Date</label>
              <input
                type="date"
                className="input"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div>
                <label className="label">Month</label>
                <select
                  className="input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {[
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ].map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select
                  className="input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[2024, 2023, 2022, 2021].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'yearly' && (
            <div>
              <label className="label">Year</label>
              <select
                className="input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2023, 2022, 2021].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'collection' && (
            <>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <button onClick={() => refetch()} className="btn-primary self-end">
            Generate Report
          </button>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="pt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total Collected</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(reportData?.totalCollected || 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Transactions</p>
                <p className="text-2xl font-bold text-green-900">
                  {reportData?.transactionCount || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Students Paid</p>
                <p className="text-2xl font-bold text-purple-900">
                  {reportData?.studentsPaid || 0}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600">Average Payment</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(reportData?.averagePayment || 0)}
                </p>
              </div>
            </div>

            {/* Chart */}
            {(reportType === 'collection' ||
              reportType === 'monthly' ||
              reportType === 'yearly') && (
              <div className="h-80 mb-6">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fee Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData?.transactions?.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    reportData?.transactions?.map((txn, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {txn.studentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {txn.feeType}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {txn.method}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportData?.transactions?.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td
                        colSpan="4"
                        className="px-4 py-3 text-sm font-semibold text-gray-900"
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(reportData?.totalCollected || 0)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
