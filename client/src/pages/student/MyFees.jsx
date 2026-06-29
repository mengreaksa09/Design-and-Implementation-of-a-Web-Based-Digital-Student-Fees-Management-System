import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, isOverdue } from '../../utils/helpers';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function MyFees() {
  const { data, isLoading } = useQuery({
    queryKey: ['myFees'],
    queryFn: async () => {
      const response = await api.get('/students/fees');
      return response.data.data;
    },
  });

  const getStatusInfo = (fee) => {
    const balance = fee.amount - (fee.paidAmount || 0);
    const isPastDue = isOverdue(fee.dueDate);

    if (balance <= 0) {
      return {
        status: 'បានទូទាត់',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    } else if (isPastDue) {
      return {
        status: 'ហួសកាលកំណត់',
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    } else {
      return {
        status: 'រង់ចាំបង់',
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    }
  };

  const calculateLateFee = (fee) => {
    const isPastDue = isOverdue(fee.dueDate);
    if (!isPastDue || !fee.FeeStructure?.lateFeeValue) return 0;

    const structure = fee.FeeStructure;
    if (structure.lateFeeType === 'percentage') {
      return (fee.amount * structure.lateFeeValue) / 100;
    }
    return structure.lateFeeValue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group fees by status
  const pendingFees =
    data?.fees?.filter((f) => f.amount > (f.paidAmount || 0)) || [];
  const paidFees =
    data?.fees?.filter((f) => f.amount <= (f.paidAmount || 0)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ថ្លៃសិក្សារបស់ខ្ញុំ</h1>
          <p className="text-gray-600">
            មើលរាល់ថ្លៃសិក្សាដែលបានកំណត់ និងស្ថានភាពការទូទាត់របស់អ្នក
          </p>
        </div>
        <Link to="/student/pay" className="btn-primary">
          ធ្វើការទូទាត់
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-600">ថ្លៃសិក្សាសរុប</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(data?.summary?.totalFees || 0)}
          </p>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">ទឹកប្រាក់បានបង់សរុប</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(data?.summary?.totalPaid || 0)}
          </p>
        </div>
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-600">សមតុល្យត្រូវបង់</p>
          <p className="text-2xl font-bold text-yellow-900">
            {formatCurrency(data?.summary?.balanceDue || 0)}
          </p>
        </div>
      </div>

      {/* Pending Fees */}
      {pendingFees.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ប្រាក់រង់ចាំបង់
          </h2>
          <div className="space-y-4">
            {pendingFees.map((fee) => {
              const statusInfo = getStatusInfo(fee);
              const lateFee = calculateLateFee(fee);
              const balance = fee.amount - (fee.paidAmount || 0) + lateFee;

              return (
                <div
                  key={fee.id}
                  className={`border rounded-lg p-4 ${
                    statusInfo.status === 'ហួសកាលកំណត់'
                      ? 'border-red-200 bg-red-50'
                      : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                        <statusInfo.icon
                          className={`h-6 w-6 ${statusInfo.color}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {fee.FeeStructure?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {fee.FeeStructure?.description}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="text-gray-600">
                            ថ្ងៃកំណត់៖{' '}
                            <span className="font-medium">
                              {formatDate(fee.dueDate)}
                            </span>
                          </span>
                          <span className={statusInfo.color}>
                            {statusInfo.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">ចំនួនទឹកប្រាក់ដើម</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(fee.amount)}
                        </p>
                      </div>
                      {fee.paidAmount > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">បានបង់រួច</p>
                          <p className="font-medium text-green-600">
                            - {formatCurrency(fee.paidAmount)}
                          </p>
                        </div>
                      )}
                      {lateFee > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-red-500">ថ្លៃយឺត</p>
                          <p className="font-medium text-red-600">
                            + {formatCurrency(lateFee)}
                          </p>
                        </div>
                      )}
                      <div className="text-right border-t pt-2">
                        <p className="text-sm text-gray-500">សមតុល្យត្រូវបង់</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(balance)}
                        </p>
                      </div>
                      <Link
                        to={`/student/pay?feeId=${fee.id}`}
                        className="btn-primary text-sm"
                      >
                        បង់ឥឡូវនេះ
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Fees */}
      {paidFees.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ថ្លៃសិក្សាបានបង់រួច
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ប្រភេទថ្លៃសិក្សា
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ចំនួនទឹកប្រាក់
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ថ្ងៃកំណត់បង់
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ស្ថានភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paidFees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {fee.FeeStructure?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(fee.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-success">បានទូទាត់</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Fees */}
      {data?.fees?.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            មិនទាន់មានការកំណត់ការបង់ថ្លៃណាមួយសម្រាប់អ្នកនៅឡើយទេ។
          </p>
        </div>
      )}
    </div>
  );
}
