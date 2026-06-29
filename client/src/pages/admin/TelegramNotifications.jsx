import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  UserGroupIcon,
  BellAlertIcon,
  LinkIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function TelegramNotifications() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const queryClient = useQueryClient();

  // Fetch linked students
  const { data: linkedStudents, isLoading } = useQuery({
    queryKey: ['telegram-linked-students'],
    queryFn: async () => {
      const response = await api.get('/telegram/linked-students');
      return response.data.data;
    },
  });

  // Dynamically extract unique courses from linked students
  const uniqueCourses = [
    ...new Set(linkedStudents?.map((s) => s.course).filter(Boolean)),
  ];

  // Filter students in memory by search term (name/ID) and course
  const filteredStudents = linkedStudents?.filter((student) => {
    const fullName = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase();
    const searchMatch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const courseMatch = !courseFilter || student.course === courseFilter;

    return searchMatch && courseMatch;
  }) || [];

  // Computed Select-All State for filtered list
  const isAllFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudents.includes(s.id));

  // Send alert mutation
  const sendAlertMutation = useMutation({
    mutationFn: async (data) => {
      if (data.studentIds.length === 1) {
        return api.post('/telegram/send-alert', {
          studentId: data.studentIds[0],
          message: data.message,
        });
      } else {
        return api.post('/telegram/send-bulk-alerts', {
          studentIds: data.studentIds,
          message: data.message,
        });
      }
    },
    onSuccess: (response) => {
      toast.success(response.data.message || 'បានផ្ញើការជូនដំណឹងដោយជោគជ័យ');
      setShowSendModal(false);
      setMessage('');
      setSelectedStudents([]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'ការផ្ញើការជូនដំណឹងបានបរាជ័យ'
      );
    },
  });

  // Unlink student mutation
  const unlinkMutation = useMutation({
    mutationFn: (studentId) =>
      api.post(`/telegram/unlink-student/${studentId}`),
    onSuccess: () => {
      toast.success('បានផ្តាច់ការភ្ជាប់របស់និស្សិតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['telegram-linked-students'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'ការផ្តាច់ការភ្ជាប់របស់និស្សិតបានបរាជ័យ');
    },
  });

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    if (isAllFilteredSelected) {
      // Uncheck only the filtered students
      setSelectedStudents(selectedStudents.filter((id) => !filteredIds.includes(id)));
    } else {
      // Check all filtered students
      setSelectedStudents([...new Set([...selectedStudents, ...filteredIds])]);
    }
  };

  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSendNotification = () => {
    if (selectedStudents.length === 0) {
      toast.error('សូមជ្រើសរើសនិស្សិតយ៉ាងតិចម្នាក់');
      return;
    }
    if (!message.trim()) {
      toast.error('សូមបញ្ចូលសារ');
      return;
    }

    sendAlertMutation.mutate({
      studentIds: selectedStudents,
      message: message.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ការជូនដំណឹងតាម Telegram
          </h1>
          <p className="text-gray-600">
            ផ្ញើការជូនដំណឹងពីថ្លៃសិក្សា និងសារផ្សេងៗទៅកាន់និស្សិតតាមរយៈ Telegram
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          disabled={selectedStudents.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          ផ្ញើការជូនដំណឹង
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">និស្សិតដែលបានភ្ជាប់</p>
              <p className="text-2xl font-bold text-gray-900">
                {linkedStudents?.length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">បានជ្រើសរើស</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedStudents.length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BellAlertIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ស្ថានភាព Bot</p>
              <p className="text-lg font-bold text-green-600">សកម្ម</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តសញ្ញាណនិស្សិត..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-auto min-w-[200px]"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">វគ្គសិក្សាទាំងអស់</option>
            {uniqueCourses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linked Students Table / Empty State */}
      {isLoading ? (
        <div className="card p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : !filteredStudents || filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="bg-blue-50 p-4 rounded-full text-blue-500 mb-4">
            <PaperAirplaneIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {searchTerm || courseFilter
              ? 'រកមិនឃើញនិស្សិតស្របតាមការស្វែងរកទេ'
              : 'មិនទាន់មាននិស្សិតភ្ជាប់ជាមួយ Telegram នៅឡើយទេ'}
          </h3>
          <p className="text-gray-500 max-w-sm">
            {searchTerm || courseFilter
              ? 'សូមព្យាយាមផ្លាស់ប្តូរពាក្យគន្លឹះស្វែងរក ឬប្រភេទចម្រោះជំនាញផ្សេងទៀត។'
              : 'និស្សិតត្រូវភ្ជាប់គណនី Telegram របស់ពួកគេជាមុនសិន ដើម្បីអាចទទួលការជូនដំណឹងពីប្រព័ន្ធ។'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              និស្សិតដែលបានភ្ជាប់
            </h2>
            {filteredStudents && filteredStudents.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-600">ជ្រើសរើសទាំងអស់</span>
              </label>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ជ្រើសរើស
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ឈ្មោះនិស្សិត
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    អត្តសញ្ញាណនិស្សិត
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    វគ្គសិក្សា
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ឈ្មោះអ្នកប្រើប្រាស់ Telegram
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                    </td>
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
                      {student.course || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      @{student.telegramUsername || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => unlinkMutation.mutate(student.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        ផ្តាច់ការភ្ជាប់
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                ផ្ញើការជូនដំណឹងតាម Telegram
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  កំពុងផ្ញើទៅកាន់និស្សិតចំនួន <strong>{selectedStudents.length}</strong> នាក់
                </p>
              </div>

              <div>
                <label className="label">សារ *</label>
                <textarea
                  className="input min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="បញ្ចូលសាររបស់អ្នកនៅទីនេះ..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  សារនេះនឹងត្រូវបានផ្ញើតាមរយៈ Telegram bot ជាមួយនឹងទម្រង់រូបអារម្មណ៍ (emoji) ដ៏សមស្រប
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ចំណាំ៖</strong> និស្សិតនឹងទទួលបានសារនេះភ្លាមៗ ប្រសិនបើពួកគេបានភ្ជាប់គណនី Telegram រួចរាល់។
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="btn-secondary"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={sendAlertMutation.isPending}
                className="btn-primary"
              >
                {sendAlertMutation.isPending
                  ? 'កំពុងផ្ញើ...'
                  : 'ផ្ញើការជូនដំណឹង'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
