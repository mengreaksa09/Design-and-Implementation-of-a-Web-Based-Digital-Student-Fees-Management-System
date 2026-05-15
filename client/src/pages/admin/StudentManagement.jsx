import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    paymentStatus: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
  });

  const queryClient = useQueryClient();

  // Fetch departments for filter
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await api.get('/departments/list');
      return response.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 10,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filters.department) params.append('department', filters.department);
      if (filters.paymentStatus)
        params.append('paymentStatus', filters.paymentStatus);

      const response = await api.get(`/students?${params}`);
      console.log('Student API Response:', response.data);
      console.log('Students array:', response.data.data);
      console.log('Students count:', response.data.data?.length);
      return {
        students: response.data.data,
        pagination: response.data.pagination,
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('បានលុបនិស្សិតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'មិនអាចលុបនិស្សិតបានទេ');
    },
  });

  const importMutation = useMutation({
    mutationFn: (formData) =>
      api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async (data) => {
      const successCount = data.data.success || 0;
      toast.success(
        `បាននាំចូលនិស្សិតចំនួន ${successCount} នាក់ដោយជោគជ័យ`
      );
      setShowImportModal(false);
      setSelectedFile(null);

      // Clear all filters and reset page
      setFilters({
        department: '',
        paymentStatus: '',
      });
      setSearchTerm('');
      setPage(1);

      // Force immediate refetch by invalidating all student-related queries
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.refetchQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'នាំចូលបរាជ័យ');
    },
  });

  const handleDelete = (id, name) => {
    setConfirmModal({ isOpen: true, studentId: id, studentName: name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(confirmModal.studentId);
    setConfirmModal({ isOpen: false, studentId: null, studentName: '' });
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('សូមជ្រើសរើសឯកសារ');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    importMutation.mutate(formData);
  };

  const getStatusBadge = (student) => {
    const totalFees = student.totalFees || 0;
    const paidFees = student.paidFees || 0;
    const percentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

    if (percentage >= 100) {
      return <span className="badge badge-success">បង់រួចរាល់</span>;
    } else if (percentage > 0) {
      return <span className="badge badge-warning">បង់មួយផ្នែក</span>;
    } else {
      return <span className="badge badge-danger">មិនទាន់បង់</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ការគ្រប់គ្រងនិស្សិត (Student Management)
          </h1>
          <p className="text-gray-600">
            គ្រប់គ្រងនិស្សិតទាំងអស់ និងកំណត់ត្រាបង់ប្រាក់របស់ពួកគេ
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            នាំចូល CSV
          </button>
          <Link
            to="/admin/students/new"
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            បន្ថែមនិស្សិត
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខសម្គាល់និស្សិត..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-200' : ''
              }`}
          >
            <FunnelIcon className="h-5 w-5" />
            ចម្រោះ
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="label">ជំនាញឯកទេស (Department)</label>
              <select
                className="input"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              >
                <option value="">ទាំងអស់ (All Departments)</option>
                {departmentsData?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">ស្ថានភាពបង់ប្រាក់ (Payment Status)</label>
              <select
                className="input"
                value={filters.paymentStatus}
                onChange={(e) =>
                  setFilters({ ...filters, paymentStatus: e.target.value })
                }
              >
                <option value="">ស្ថានភាពទាំងអស់</option>
                <option value="paid">បានបង់ប្រាក់ពេញលេញ</option>
                <option value="partial">បានបង់ប្រាក់មួយផ្នែក</option>
                <option value="unpaid">មិនទាន់បង់ប្រាក់</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  និស្សិត (Student)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  លេខសម្គាល់
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ជំនាញឯកទេស
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ថ្លៃសិក្សាសរុប
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  បានបង់
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
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : data?.students?.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    រកមិនឃើញនិស្សិតទេ
                  </td>
                </tr>
              ) : (
                data?.students?.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {student.user?.firstName?.charAt(0)}
                            {student.user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {departmentsData?.find(d => d.id == student.department)?.name || student.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(student.totalFees || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(student.paidFees || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="text-gray-400 hover:text-primary-600"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/admin/students/${student.id}/edit`}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(
                              student.id,
                              `${student.user?.firstName} ${student.user?.lastName}`
                            )
                          }
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.total > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              បង្ហាញ {(page - 1) * 10 + 1} ដល់{' '}
              {Math.min(page * 10, data.pagination.total)} នៃ{' '}
              {data.pagination.total} និស្សិត
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(Math.min(5, data.pagination.totalPages))].map(
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 border rounded-lg ${page === i + 1
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                }
                disabled={page === data.pagination.totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              នាំចូលនិស្សិត
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-500 font-medium">
                    ជ្រើសរើសឯកសារ
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">ឬទាញទម្លាក់</p>
                <p className="text-xs text-gray-400 mt-1">
                  ត្រឹមតែឯកសារ CSV ឬ Excel ប៉ុណ្ណោះ
                </p>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">ជួរឈរ CSV ដែលតម្រូវឲ្យមាន៖</p>
                <code className="text-xs bg-gray-100 p-2 rounded block whitespace-pre-wrap">
                  email,password,firstName,lastName,studentId,class,department
                </code>
                <p className="text-xs text-gray-400 mt-2">
                  ចំណាំ៖ email, password, firstName, lastName ជាកន្លែងដែលតម្រូវឲ្យបំពេញ។
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                }}
                className="flex-1 btn-secondary"
              >
                បោះបង់
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile || importMutation.isPending}
                className="flex-1 btn-primary"
              >
                {importMutation.isPending ? 'កំពុងនាំចូល...' : 'នាំចូល'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, studentId: null, studentName: '' })
        }
        onConfirm={confirmDelete}
        title="លុបនិស្សិត"
        message={`តើអ្នកពិតជាចង់លុបបន្ត ${confirmModal.studentName} មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`}
        confirmText="លុប"
        type="danger"
      />
    </div>
  );
}
