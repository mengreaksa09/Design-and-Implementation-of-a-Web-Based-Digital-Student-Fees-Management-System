import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
  });
  const [viewingUser, setViewingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'accountant',
    phone: '',
    isActive: true,
  });

  const queryClient = useQueryClient();

  // Format phone number: +855 XX XXX XXX XXX
  const formatPhoneNumber = (value) => {
    if (!value || value.length === 0) {
      return '+855 ';
    }
    let cleaned = value.replace(/\s/g, '');
    if (!cleaned.startsWith('+855')) {
      cleaned = '+855' + cleaned.replace(/^\+?\d{0,3}/, '');
    }
    const prefix = '+855';
    const digits = cleaned.slice(4);
    if (digits.length === 0) {
      return prefix + ' ';
    }
    let formatted = prefix + ' ';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5 || i === 8) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    return formatted;
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users?limit=1000');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      toast.success('អ្នកប្រើប្រាស់ត្រូវបានបង្កើតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'ការបង្កើតអ្នកប្រើប្រាស់បានបរាជ័យ');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('អ្នកប្រើប្រាស់ត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'ការធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់បានបរាជ័យ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('អ្នកប្រើប្រាស់ត្រូវបានលុបដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'ការលុបអ្នកប្រើប្រាស់បានបរាជ័យ');
    },
  });

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone || '',
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'accountant',
        phone: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingUser) {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({ isOpen: true, userId: id, userName: name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(confirmModal.userId);
    setConfirmModal({ isOpen: false, userId: null, userName: '' });
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700',
      accountant: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700',
      parent: 'bg-orange-100 text-orange-700',
    };
    const labels = {
      admin: 'អ្នកគ្រប់គ្រង',
      accountant: 'គណនេយ្យករ',
      student: 'និស្សិត',
      parent: 'អាណាព្យាបាល',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[role] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ការគ្រប់គ្រងអ្នកប្រើប្រាស់</h1>
          <p className="text-gray-600">
            គ្រប់គ្រងអ្នកប្រើប្រាស់ជាអ្នកគ្រប់គ្រង និងគណនេយ្យករ (និស្សិតត្រូវបានគ្រប់គ្រងតាមរយៈ Telegram Bot)
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          បន្ថែមអ្នកប្រើប្រាស់
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">អ្នកប្រើប្រាស់សរុប</p>
          <p className="text-2xl font-bold text-gray-900">
            {users?.filter((u) => u.role !== 'student' && u.isActive).length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">អ្នកគ្រប់គ្រង</p>
          <p className="text-2xl font-bold text-purple-600">
            {users?.filter((u) => u.role === 'admin' && u.isActive).length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">គណនេយ្យករ</p>
          <p className="text-2xl font-bold text-blue-600">
            {users?.filter((u) => u.role === 'accountant' && u.isActive).length || 0}
          </p>
        </div>
      </div>

      {/* Users Table / Empty State */}
      {isLoading ? (
        <div className="card p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : !users || users.filter((user) => user.role !== 'student' && user.isActive).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-150 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="bg-purple-50 p-4 rounded-full text-purple-500 mb-4">
            <PlusIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            មិនទាន់មានអ្នកប្រើប្រាស់ទេ
          </h3>
          <p className="text-gray-500 max-w-sm mb-4">
            សូមចុចប៊ូតុងខាងក្រោម ឬប៊ូតុងខាងលើ ដើម្បីបន្ថែមអ្នកប្រើប្រាស់ថ្មី។
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            បន្ថែមអ្នកប្រើប្រាស់
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    អ្នកប្រើប្រាស់
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    តួនាទី
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ស្ថានភាព
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ការចូលប្រព័ន្ធចុងក្រោយ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users
                  ?.filter((user) => user.role !== 'student' && user.isActive)
                  .map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {user.firstName?.charAt(0)}
                              {user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            user.isActive ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {user.isActive ? 'សកម្ម' : 'អសកម្ម'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'មិនដែលចូល'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                            title="មើល"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(user)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="កែសម្រួល"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(
                                user.id,
                                `${user.firstName} ${user.lastName}`
                              )
                            }
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="លុប"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'កែសម្រួលអ្នកប្រើប្រាស់' : 'បន្ថែមអ្នកប្រើប្រាស់'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">នាមខ្លួន *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">នាមត្រកូល *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">អ៊ីមែល *</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label">
                  លេខសម្ងាត់ {editingUser ? '(ទុកទទេដើម្បីរក្សាលេខសម្ងាត់បច្ចុប្បន្ន)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">តួនាទី *</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <option value="accountant">គណនេយ្យករ</option>
                  <option value="admin">អ្នកគ្រប់គ្រង</option>
                </select>
              </div>

              <div>
                <label className="label">លេខទូរស័ព្ទ</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                  }
                  onFocus={(e) => {
                    if (!e.target.value) {
                      setFormData({ ...formData, phone: '+855 ' });
                    }
                  }}
                  placeholder="+855 12 345 678"
                  maxLength={20}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span>គណនីសកម្ម</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-secondary"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'កំពុងរក្សាទុក...'
                    : editingUser
                    ? 'ធ្វើបច្ចុប្បន្នភាព'
                    : 'បង្កើត'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, userId: null, userName: '' })
        }
        onConfirm={confirmDelete}
        title="លុបអ្នកប្រើប្រាស់"
        message={`តើអ្នកពិតជាចង់លុបអ្នកប្រើប្រាស់ "${confirmModal.userName}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានឡើយ។`}
        confirmText="លុប"
        cancelText="បោះបង់"
        type="danger"
      />

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                ព័ត៌មានលម្អិតរបស់អ្នកប្រើប្រាស់
              </h2>
              <button
                onClick={() => setViewingUser(null)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-xl">
                    {viewingUser.firstName?.charAt(0)}
                    {viewingUser.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewingUser.firstName} {viewingUser.lastName}
                  </h3>
                  <p className="text-gray-500">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    តួនាទី
                  </label>
                  <p className="mt-1">{getRoleBadge(viewingUser.role)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    ស្ថានភាព
                  </label>
                  <p className="mt-1">
                    <span
                      className={`badge ${
                        viewingUser.isActive ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {viewingUser.isActive ? 'សកម្ម' : 'អសកម្ម'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    លេខទូរស័ព្ទ
                  </label>
                  <p className="mt-1 text-gray-900">
                    {viewingUser.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    ការចូលប្រព័ន្ធចុងក្រោយ
                  </label>
                  <p className="mt-1 text-gray-900">
                    {viewingUser.lastLogin
                      ? formatDate(viewingUser.lastLogin)
                      : 'មិនដែលចូល'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    បានបង្កើតកាលពី
                  </label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(viewingUser.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    ការផ្ទៀងផ្ទាត់អ៊ីមែល
                  </label>
                  <p className="mt-1">
                    <span
                      className={`badge ${
                        viewingUser.isEmailVerified
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {viewingUser.isEmailVerified ? 'បានផ្ទៀងផ្ទាត់' : 'កំពុងរង់ចាំ'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setViewingUser(null)}
                className="btn-secondary"
              >
                បិទ
              </button>
              <button
                onClick={() => {
                  setViewingUser(null);
                  openModal(viewingUser);
                }}
                className="btn-primary"
              >
                កែសម្រួលអ្នកប្រើប្រាស់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
