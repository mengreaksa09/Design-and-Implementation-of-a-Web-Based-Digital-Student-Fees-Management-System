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
} from '@heroicons/react/24/outline';

export default function TelegramNotifications() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const queryClient = useQueryClient();

  // Fetch linked students
  const { data: linkedStudents, isLoading } = useQuery({
    queryKey: ['telegram-linked-students'],
    queryFn: async () => {
      const response = await api.get('/telegram/linked-students');
      return response.data.data;
    },
  });

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
      toast.success(response.data.message || 'Notifications sent successfully');
      setShowSendModal(false);
      setMessage('');
      setSelectedStudents([]);
      setSelectAll(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to send notifications'
      );
    },
  });

  // Unlink student mutation
  const unlinkMutation = useMutation({
    mutationFn: (studentId) =>
      api.post(`/telegram/unlink-student/${studentId}`),
    onSuccess: () => {
      toast.success('Student unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['telegram-linked-students'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unlink student');
    },
  });

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(linkedStudents?.map((s) => s.id) || []);
    }
    setSelectAll(!selectAll);
  };

  const handleStudentSelect = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
      setSelectAll(false);
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSendNotification = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
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
            Telegram Notifications
          </h1>
          <p className="text-gray-600">
            Send fee alerts and notifications to students via Telegram
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          disabled={!linkedStudents || linkedStudents.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          Send Notification
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
              <p className="text-sm text-gray-600">Linked Students</p>
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
              <p className="text-sm text-gray-600">Selected</p>
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
              <p className="text-sm text-gray-600">Bot Status</p>
              <p className="text-lg font-bold text-green-600">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Students Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Linked Students
          </h2>
          {linkedStudents && linkedStudents.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </label>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telegram Username
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : linkedStudents?.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No students linked to Telegram yet
                  </td>
                </tr>
              ) : (
                linkedStudents?.map((student) => (
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
                      {student.class || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      @{student.telegramUsername || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => unlinkMutation.mutate(student.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Send Telegram Notification
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Sending to <strong>{selectedStudents.length}</strong>{' '}
                  student(s)
                </p>
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  className="input min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The message will be sent via Telegram bot with appropriate
                  emoji formatting
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Students will receive this message
                  immediately if they have linked their Telegram account.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendNotification}
                  disabled={sendAlertMutation.isPending}
                  className="flex-1 btn-primary"
                >
                  {sendAlertMutation.isPending
                    ? 'Sending...'
                    : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
