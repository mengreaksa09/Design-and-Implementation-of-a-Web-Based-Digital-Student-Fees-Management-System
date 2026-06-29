import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function FeeAssignments() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFee, setSelectedFee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignType, setAssignType] = useState('individual'); // individual, class, all
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    assignmentId: null,
  });

  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['feeAssignments'],
    queryFn: async () => {
      const response = await api.get('/fees/assignments');
      return response.data.data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const response = await api.get('/students?limit=1000');
      return response.data.data;
    },
  });

  const { data: feeStructures } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: async () => {
      const response = await api.get('/fees/structures');
      return response.data.data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/courses/list');
      return response.data.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data) => {
      console.log('Assignment payload:', data);
      if (data.assignType === 'individual') {
        const payload = {
          feeStructureId: data.feeStructureId,
          studentIds: data.studentIds,
          dueDate: data.dueDate,
        };
        console.log('Sending individual assignment:', payload);
        return api.post('/fees/assign', payload);
      } else if (data.assignType === 'course') {
        const payload = {
          feeStructureId: data.feeStructureId,
          dueDate: data.dueDate,
          department: data.courseFilter,
        };
        console.log('Sending course assignment:', payload);
        return api.post('/fees/assign-bulk', payload);
      } else if (data.assignType === 'all') {
        const payload = {
          feeStructureId: data.feeStructureId,
          dueDate: data.dueDate,
        };
        console.log('Sending all assignment:', payload);
        return api.post('/fees/assign-bulk', payload);
      }
    },
    onSuccess: (response) => {
      console.log('Assignment success:', response.data);
      const data = response.data.data;
      const assigned = data?.assigned || 0;
      const failed = data?.failed || 0;

      if (assigned > 0) {
        toast.success(
          `បានកំណត់ការបង់ថ្លៃទៅកាន់និស្សិតចំនួន ${assigned} នាក់ដោយជោគជ័យ${failed > 0 ? ` (${failed} នាក់បានបរាជ័យ ដោយសារធ្លាប់បានកំណត់រួចហើយ)` : ''
          }`
        );
      } else if (failed > 0) {
        toast.error(
          `ការកំណត់ការបង់ថ្លៃបានបរាជ័យ។ និស្សិតចំនួន ${failed} នាក់ត្រូវបានកំណត់រួចរាល់ហើយ។`
        );
      } else {
        toast.error('មិនមាននិស្សិតណាម្នាក់ត្រូវបានកំណត់ការបង់ថ្លៃឡើយ។');
      }

      queryClient.invalidateQueries({ queryKey: ['feeAssignments'] });
      closeModal();
    },
    onError: (error) => {
      console.error('Assignment error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'ការកំណត់ការបង់ថ្លៃបានបរាជ័យ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/fees/assignments/${id}`),
    onSuccess: () => {
      toast.success('បានលុបការកំណត់ការបង់ថ្លៃរួចរាល់');
      queryClient.invalidateQueries({ queryKey: ['feeAssignments'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'ការលុបការកំណត់ការបង់ថ្លៃបានបរាជ័យ'
      );
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudents([]);
    setSelectedFee('');
    setDueDate('');
    setAssignType('individual');
  };

  const handleAssign = () => {
    if (!selectedFee || !dueDate) {
      toast.error('សូមជ្រើសរើសប្រភេទបង់ថ្លៃ និងថ្ងៃកំណត់បង់ប្រាក់');
      return;
    }

    if (assignType === 'individual' && selectedStudents.length === 0) {
      toast.error('សូមជ្រើសរើសនិស្សិតយ៉ាងតិចម្នាក់');
      return;
    }

    if (assignType === 'course') {
      const courseValue = document.getElementById('courseFilter')?.value;
      if (!courseValue) {
        toast.error('សូមជ្រើសរើសមុខវិជ្ជា');
        return;
      }
    }

    let payload = {
      feeStructureId: selectedFee,
      dueDate,
      assignType,
    };
    if (assignType === 'individual') {
      payload.studentIds = selectedStudents;
    } else if (assignType === 'course') {
      payload.courseFilter = document.getElementById('courseFilter').value;
    }
    assignMutation.mutate(payload);
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const filteredStudents = students?.filter((s) =>
    `${s.user?.firstName} ${s.user?.lastName} ${s.studentId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (assignment) => {
    const paidAmount = parseFloat(assignment.paidAmount || 0);
    const totalAmount = parseFloat(assignment.totalAmount || 0);

    if (paidAmount >= totalAmount && totalAmount > 0) {
      return <span className="badge badge-success">បានទូទាត់</span>;
    } else if (paidAmount > 0) {
      return <span className="badge badge-warning">បានទូទាត់មួយផ្នែក</span>;
    } else if (isOverdue(assignment.dueDate)) {
      return <span className="badge badge-danger">ហួសកំណត់</span>;
    } else {
      return <span className="badge bg-gray-100 text-gray-700">មិនទាន់ទូទាត់</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ការកំណត់ការបង់ថ្លៃ</h1>
          <p className="text-gray-600">
            កំណត់ការបង់ថ្លៃសម្រាប់និស្សិត និងតាមដានការទូទាត់
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          កំណត់ការបង់ថ្លៃ
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-600">សរុបការកំណត់</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(
              assignments?.reduce(
                (sum, a) => sum + parseFloat(a.totalAmount || 0),
                0
              ) || 0
            )}
          </p>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">ទទួលបាន</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(
              assignments?.reduce(
                (sum, a) => sum + parseFloat(a.paidAmount || 0),
                0
              ) || 0
            )}
          </p>
        </div>
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-600">មិនទាន់ទូទាត់</p>
          <p className="text-2xl font-bold text-yellow-900">
            {formatCurrency(
              assignments?.reduce(
                (sum, a) => sum + parseFloat(a.balanceAmount || 0),
                0
              ) || 0
            )}
          </p>
        </div>
        <div className="card bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">ហួសកំណត់</p>
          <p className="text-2xl font-bold text-red-900">
            {assignments?.filter(
              (a) =>
                isOverdue(a.dueDate) &&
                parseFloat(a.balanceAmount || 0) > 0
            ).length || 0}
          </p>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
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
                  បានទូទាត់
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ថ្ងៃកំណត់
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
              ) : assignments?.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    មិនទាន់មានការកំណត់ការបង់ថ្លៃទេ
                  </td>
                </tr>
              ) : (
                assignments?.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.student?.user ? (
                            `${assignment.student.user.firstName} ${assignment.student.user.lastName}`
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.student?.studentId || `ID: ${assignment.studentId}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.feeStructure?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(assignment.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(assignment.paidAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(assignment.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(assignment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            assignmentId: assignment.id,
                          })
                        }
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        លុប
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Fee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                កំណត់ការបង់ថ្លៃ
              </h2>
              <button
                onClick={closeModal}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Assignment Type */}
              <div>
                <label className="label">ប្រភេទចំណាត់</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignType"
                      value="individual"
                      checked={assignType === 'individual'}
                      onChange={(e) => setAssignType(e.target.value)}
                      className="text-primary-600"
                    />
                    <span>និស្សិតម្នាក់ៗ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignType"
                      value="course"
                      checked={assignType === 'course'}
                      onChange={(e) => setAssignType(e.target.value)}
                      className="text-primary-600"
                    />
                    <span>តាមមុខវិជ្ជា</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignType"
                      value="all"
                      checked={assignType === 'all'}
                      onChange={(e) => setAssignType(e.target.value)}
                      className="text-primary-600"
                    />
                    <span>និស្សិតទាំងអស់</span>
                  </label>
                </div>
              </div>

              {/* Fee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">រចនាសម្ព័ន្ធការបង់ថ្លៃ*</label>
                  <select
                    className="input"
                    value={selectedFee}
                    onChange={(e) => setSelectedFee(e.target.value)}
                    required
                  >
                    <option value="">ជ្រើសរើសរចនាសម្ព័ន្ធបង់ថ្លៃ</option>
                    {feeStructures?.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.name} - {formatCurrency(fee.amount)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">ថ្ងៃកំណត់​*</label>
                  <input
                    type="date"
                    className="input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Class Filter */}
              {assignType === 'course' && (
                <div>
                  <label className="label">ជ្រើសរើសមុខវិជ្ជា</label>
                  <select id="courseFilter" className="input" defaultValue="">
                    <option value="" disabled>ជ្រើសរើសមុខវិជ្ជា</option>
                    {courses?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Selection */}
              {assignType === 'individual' && (
                <div>
                  <label className="label">ជ្រើសរើសនិស្សិត </label>
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {selectedStudents.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selectedStudents.map((id) => {
                        const student = students?.find((s) => s.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                          >
                            {student?.user?.firstName} {student?.user?.lastName}
                            <button
                              onClick={() => toggleStudent(id)}
                              className="hover:text-primary-900"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {filteredStudents?.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="text-primary-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.studentId} • {student.department || 'N/A'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {assignType === 'all' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      កំពុងកំណត់សម្រាប់និស្សិតទាំងអស់
                    </p>
                    <p className="text-sm text-yellow-700">
                      នេះនឹងកំណត់ការបង់ថ្លៃដែលបានជ្រើសរើសទៅនិស្សិតទាំងអស់{' '}
                      {students?.length || 0} នាក់ក្នុងប្រព័ន្ធ។
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 p-6 border-t">
              <button onClick={closeModal} className="btn-secondary">
                បោះបង់
              </button>
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                className="btn-primary"
              >
                {assignMutation.isPending ? 'កំពុងកំណត់...' : 'កំណត់ការបង់ថ្លៃ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, assignmentId: null })}
        onConfirm={() => {
          deleteMutation.mutate(confirmModal.assignmentId);
          setConfirmModal({ isOpen: false, assignmentId: null });
        }}
        title="លុបការកំណត់ការបង់ថ្លៃ"
        message="តើអ្នកពិតជាចង់លុបការកំណត់ការបង់ថ្លៃនេះមែនទេ?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
