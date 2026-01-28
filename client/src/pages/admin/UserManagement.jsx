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

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
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
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[role] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage admin and accountant users (Students managed via Telegram
            Bot)
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {users?.filter((u) => u.role !== 'student').length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold text-purple-600">
            {users?.filter((u) => u.role === 'admin').length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Accountants</p>
          <p className="text-2xl font-bold text-blue-600">
            {users?.filter((u) => u.role === 'accountant').length || 0}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users
                  ?.filter((user) => user.role !== 'student')
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
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openModal(user)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit"
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
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add User'}
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
                  <label className="label">First Name *</label>
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
                  <label className="label">Last Name *</label>
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
                <label className="label">Email *</label>
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
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
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
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
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
                <span>Active user</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingUser
                    ? 'Update'
                    : 'Create'}
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
        title="Delete User"
        message={`Are you sure you want to delete "${confirmModal.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                User Details
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
                    Role
                  </label>
                  <p className="mt-1">{getRoleBadge(viewingUser.role)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`badge ${
                        viewingUser.isActive ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {viewingUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </label>
                  <p className="mt-1 text-gray-900">
                    {viewingUser.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </label>
                  <p className="mt-1 text-gray-900">
                    {viewingUser.lastLogin
                      ? formatDate(viewingUser.lastLogin)
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Created
                  </label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(viewingUser.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Email Verified
                  </label>
                  <p className="mt-1">
                    <span
                      className={`badge ${
                        viewingUser.isEmailVerified
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {viewingUser.isEmailVerified ? 'Verified' : 'Pending'}
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
                Close
              </button>
              <button
                onClick={() => {
                  setViewingUser(null);
                  openModal(viewingUser);
                }}
                className="btn-primary"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
