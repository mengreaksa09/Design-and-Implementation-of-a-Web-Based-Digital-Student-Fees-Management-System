import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PlusIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function PaymentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeAssignmentId: '',
    amount: '',
    paymentMethod: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    paymentId: null,
    reason: '',
  });

  const queryClient = useQueryClient();

  // Fetch students with unpaid/partial fee assignments only
  const { data: studentsData } = useQuery({
    queryKey: ['students-with-fees'],
    queryFn: async () => {
      const response = await api.get(
        '/fees/assignments?status=pending&limit=1000'
      );
      const pendingAssignments = response.data.data;

      const partialResponse = await api.get(
        '/fees/assignments?status=partial&limit=1000'
      );
      const partialAssignments = partialResponse.data.data;

      const allAssignments = [...pendingAssignments, ...partialAssignments];

      // Get unique students with outstanding balances
      const uniqueStudents = [];
      const studentIds = new Set();

      allAssignments.forEach((assignment) => {
        if (
          assignment.student &&
          assignment.balanceAmount > 0 &&
          !studentIds.has(assignment.student.id)
        ) {
          studentIds.add(assignment.student.id);
          uniqueStudents.push(assignment.student);
        }
      });

      return uniqueStudents;
    },
  });

  // Fetch fee assignments for selected student
  const { data: feeAssignmentsData } = useQuery({
    queryKey: ['fee-assignments', paymentForm.studentId],
    queryFn: async () => {
      if (!paymentForm.studentId) return null;
      const response = await api.get(
        `/fees/assignments?studentId=${paymentForm.studentId}&limit=100`
      );
      return response.data;
    },
    enabled: !!paymentForm.studentId,
  });

  const feeAssignments =
    feeAssignmentsData?.data?.filter((fa) => fa.balanceAmount > 0) || [];

  const { data, isLoading } = useQuery({
    queryKey: ['payments', searchTerm, statusFilter, methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);

      const response = await api.get(`/payments?${params}`);
      return {
        payments: response.data.data || [],
        pagination: response.data.pagination,
        summary: {
          total: response.data.data?.length || 0,
          completed:
            response.data.data?.filter((p) => p.status === 'completed')
              ?.length || 0,
          pending:
            response.data.data?.filter((p) => p.status === 'pending')?.length ||
            0,
          totalAmount:
            response.data.data?.reduce(
              (sum, p) => sum + parseFloat(p.amount || 0),
              0
            ) || 0,
        },
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.put(`/payments/${id}/approve`),
    onSuccess: () => {
      toast.success('Payment approved');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      api.put(`/payments/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Payment rejected');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data) => api.post('/payments/manual', data),
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowPaymentModal(false);
      setPaymentForm({
        studentId: '',
        feeAssignmentId: '',
        amount: '',
        paymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const handleApprove = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'approve',
      paymentId: id,
      reason: '',
    });
  };

  const handleReject = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      paymentId: id,
      reason: '',
    });
  };

  const confirmAction = (value) => {
    if (confirmModal.type === 'approve') {
      approveMutation.mutate(confirmModal.paymentId);
    } else if (confirmModal.type === 'reject' && value) {
      rejectMutation.mutate({ id: confirmModal.paymentId, reason: value });
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRecordPayment = () => {
    if (
      !paymentForm.studentId ||
      !paymentForm.feeAssignmentId ||
      !paymentForm.amount
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    recordPaymentMutation.mutate(paymentForm);
  };

  const handleStudentChange = (studentId) => {
    setPaymentForm({
      ...paymentForm,
      studentId,
      feeAssignmentId: '',
      amount: '',
    });
  };

  const handleFeeAssignmentChange = (feeAssignmentId) => {
    const selected = feeAssignments?.find((fa) => fa.id === feeAssignmentId);
    setPaymentForm({
      ...paymentForm,
      feeAssignmentId,
      amount: selected?.balanceAmount || '',
    });
  };

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
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const exportPayments = async () => {
    try {
      const response = await api.get('/payments/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `payments-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export successful');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'badge badge-success',
      pending: 'badge badge-warning',
      failed: 'badge badge-danger',
      refunded: 'badge bg-gray-100 text-gray-700',
    };
    const labels = {
      completed: 'បានបញ្ចប់',
      pending: 'កំពុងរង់ចាំ',
      failed: 'បរាជ័យ',
      refunded: 'បានបង្វិលសង',
    };
    return <span className={styles[status] || 'badge'}>{labels[status] || status}</span>;
  };

  const getMethodBadge = (method) => {
    const styles = {
      cash: 'bg-green-100 text-green-700',
      bank_transfer: 'bg-purple-100 text-purple-700',
    };
    const labels = {
      cash: 'សាច់ប្រាក់',
      bank_transfer: 'ផ្ទេរតាមធនាគារ',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          styles[method] || ''
        }`}
      >
        {labels[method] || method?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ការគ្រប់គ្រងការទូទាត់ (Payment Management)
          </h1>
          <p className="text-gray-600">
            បង្ហាញ និងគ្រប់គ្រងប្រតិបត្តិការទូទាត់ទាំងអស់
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            កត់ត្រាការទូទាត់
          </button>
          <button
            onClick={exportPayments}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            នាំចេញទៅ Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">ប្រតិបត្តិការសរុប</p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.summary?.total || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">បានបញ្ចប់</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.summary?.completed || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">កំពុងរង់ចាំការអនុម័ត</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data?.summary?.pending || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">ទឹកប្រាក់សរុប</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(data?.summary?.totalAmount || 0)}
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
              placeholder="ស្វែងរកតាមឈ្មោះនិស្សិត ឬលេខប្រតិបត្តិការ..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ស្ថានភាពទាំងអស់</option>
            <option value="completed">បានបញ្ចប់</option>
            <option value="pending">កំពុងរង់ចាំ</option>
            <option value="failed">បរាជ័យ</option>
            <option value="refunded">បានបង្វិលត្រឡប់មកវិញ</option>
          </select>
          <select
            className="input w-auto"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">វិធីសាស្ត្រទាំងអស់</option>
            <option value="cash">សាច់ប្រាក់</option>
            <option value="bank_transfer">ផ្ទេរតាមធនាគារ</option>
          </select>
        </div>
      </div>

      {/* Payments Table / Empty State */}
      {isLoading ? (
        <div className="card p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : !data?.payments || data.payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="bg-green-50 p-4 rounded-full text-green-500 mb-4">
            <BanknotesIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            មិនទាន់មានការទូទាត់ទេ
          </h3>
          <p className="text-gray-500 max-w-sm mb-4">
            សូមចុចប៊ូតុងខាងក្រោម ឬប៊ូតុងខាងលើ ដើម្បីកត់ត្រាការទូទាត់ថ្មីដំបូងរបស់អ្នក។
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            កត់ត្រាការទូទាត់
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    លេខប្រតិបត្តិការ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ឈ្មោះនិស្សិត
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ប្រភេទការបង់ថ្លៃ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ចំនួនទឹកប្រាក់
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    វិធីសាស្ត្រ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    កាលបរិច្ឆេទ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ស្ថានភាព
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.payments?.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.receiptNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.student?.user?.firstName}{' '}
                          {payment.student?.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.student?.studentId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.feeAssignment?.feeStructure?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMethodBadge(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowReceiptModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => downloadReceipt(payment.id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Download Receipt"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                        )}
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(payment.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Approve"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(payment.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Reject"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showReceiptModal && selectedPayment && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                ព័ត៌មានលម្អិតនៃការទូទាត់
              </h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* ព័ត៌មានលម្អិតនៃការទូទាត់ */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">លេខប្រតិបត្តិការ:</p>
                  <p className="font-mono font-medium">
                    {selectedPayment.receiptNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ស្ថានភាព:</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">ឈ្មោះនិស្សិត:</p>
                  <p className="font-medium">
                    {selectedPayment.student?.user?.firstName}{' '}
                    {selectedPayment.student?.user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">អត្តសញ្ញាណនិស្សិត:</p>
                  <p className="font-medium">
                    {selectedPayment.student?.studentId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ចំនួនទឹកប្រាក់:</p>
                  <p className="text-xl font-bold text-primary-600">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">វិធីសាស្ត្រទូទាត់:</p>
                  {getMethodBadge(selectedPayment.paymentMethod)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">កាលបរិច្ឆេទ:</p>
                  <p className="font-medium">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ប្រភេទការបង់ថ្លៃ:</p>
                  <p className="font-medium">
                    {selectedPayment.feeAssignment?.feeStructure?.name || 'N/A'}
                  </p>
                </div>
                {selectedPayment.transaction?.transactionId && (
                  <div>
                    <p className="text-sm text-gray-500">លេខសម្គាល់ប្រតិបត្តិការ:</p>
                    <p className="font-mono font-medium text-sm text-primary-600">
                      {selectedPayment.transaction.transactionId}
                    </p>
                  </div>
                )}
              </div>

              {selectedPayment.stripePaymentIntentId && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">ការទូទាត់តាម Stripe (Stripe Payment Intent)</p>
                  <p className="font-mono text-sm">
                    {selectedPayment.stripePaymentIntentId}
                  </p>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">កំណត់សម្គាល់ (Notes)</p>
                  <p className="text-gray-700">{selectedPayment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="btn-secondary"
              >
                បិទ
              </button>
              {selectedPayment.status === 'completed' && (
                <button
                  onClick={() => downloadReceipt(selectedPayment.id)}
                  className="btn-primary flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  ទាញយកបង្កាន់ដៃ
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Approve/Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        onConfirm={confirmAction}
        title={
          confirmModal.type === 'approve' ? 'អនុម័តការទូទាត់' : 'បដិសេធការទូទាត់'
        }
        message={
          confirmModal.type === 'approve'
            ? 'តើអ្នកពិតជាចង់អនុម័តការទូទាត់នេះមែនទេ?'
            : 'សូមបញ្ចូលមូលហេតុនៃការបដិសេធការទូទាត់នេះ។'
        }
        confirmText={confirmModal.type === 'approve' ? 'អនុម័ត' : 'បដិសេធ'}
        cancelText="បោះបង់"
        type={confirmModal.type === 'approve' ? 'success' : 'danger'}
        showInput={confirmModal.type === 'reject'}
        inputLabel="មូលហេតុនៃការបដិសេធ"
        inputPlaceholder="បញ្ចូលមូលហេតុនៃការបដិសេធ..."
        inputValue={confirmModal.reason}
        onInputChange={(value) =>
          setConfirmModal({ ...confirmModal, reason: value })
        }
        inputRequired={confirmModal.type === 'reject'}
      />

      {/* Record Payment Modal */}
      {showPaymentModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  កត់ត្រាការទូទាត់ (Record Payment)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  កត់ត្រាការទូទាត់ថ្មីសម្រាប់ថ្លៃសិក្សារបស់និស្សិត
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">ឈ្មោះនិស្សិត *</label>
                <select
                  className="input"
                  value={paymentForm.studentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    ជ្រើសរើសនិស្សិត
                  </option>
                  {studentsData?.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.studentId} - {student.user?.firstName}{' '}
                      {student.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {paymentForm.studentId && (
                <div>
                  <label className="label">ការកំណត់ការបង់ថ្លៃ *</label>
                  <select
                    className="input"
                    value={paymentForm.feeAssignmentId}
                    onChange={(e) => handleFeeAssignmentChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      ជ្រើសរើសការបង់ថ្លៃ
                    </option>
                    {feeAssignments?.map((fa) => (
                      <option key={fa.id} value={fa.id}>
                        {fa.feeStructure?.name} - Balance:{' '}
                        {formatCurrency(fa.balanceAmount)}
                      </option>
                    ))}
                  </select>
                  {feeAssignments?.length === 0 && (
                    <p className="text-sm text-yellow-600 mt-1">
                      គ្មានការបង់ថ្លៃដែលនៅសេសសល់សម្រាប់និស្សិតនេះទេ
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">ចំនួនទឹកប្រាក់ *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    className="input pl-8"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    USD
                  </span>
                </div>
              </div>

              <div>
                <label className="label">វិធីសាស្ត្រទូទាត់ *</label>
                <select
                  className="input"
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    ជ្រើសរើសវិធីសាស្ត្រទូទាត់
                  </option>
                  <option value="cash">សាច់ប្រាក់</option>
                  <option value="bank_transfer">ផ្ទេរតាមធនាគារ</option>
                </select>
              </div>

              <div>
                <label className="label">កាលបរិច្ឆេទអនុវត្ត *</label>
                <input
                  type="date"
                  className="input"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">កំណត់សម្គាល់</label>
                <textarea
                  className="input"
                  rows="3"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="បន្ថែមការកំណត់សម្គាល់..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({
                    studentId: '',
                    feeAssignmentId: '',
                    amount: '',
                    paymentMethod: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    notes: '',
                  });
                }}
                className="btn-secondary"
                disabled={recordPaymentMutation.isPending}
              >
                បោះបង់
              </button>
              <button
                onClick={handleRecordPayment}
                className="btn-primary"
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending
                  ? 'កំពុងកត់ត្រា...'
                  : 'កត់ត្រាការទូទាត់'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
