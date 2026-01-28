import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm();
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm();
  const newPassword = watch('newPassword');

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data.data;
    },
  });

  // Set form values when profile is loaded
  useEffect(() => {
    if (profile) {
      resetProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || '',
      });
    }
  }, [profile, resetProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (response) => {
      toast.success('Profile updated successfully');
      setUser(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/users/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPassword();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600">
              {profile?.firstName?.charAt(0)}
              {profile?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-gray-600">{profile?.email}</p>
            <span className="badge bg-primary-100 text-primary-700 mt-2">
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Personal Information
          </h3>
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className={`input ${
                    profileErrors.firstName ? 'border-red-500' : ''
                  }`}
                  {...registerProfile('firstName', {
                    required: 'First name is required',
                  })}
                />
                {profileErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">
                    {profileErrors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className={`input ${
                    profileErrors.lastName ? 'border-red-500' : ''
                  }`}
                  {...registerProfile('lastName', {
                    required: 'Last name is required',
                  })}
                />
                {profileErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">
                    {profileErrors.lastName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input bg-gray-50"
                  disabled
                  {...registerProfile('email')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  {...registerProfile('phone')}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Change Password
          </h3>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-6 max-w-md"
          >
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={`input pr-10 ${
                    passwordErrors.currentPassword ? 'border-red-500' : ''
                  }`}
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required',
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className={`input pr-10 ${
                    passwordErrors.newPassword ? 'border-red-500' : ''
                  }`}
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className={`input ${
                  passwordErrors.confirmPassword ? 'border-red-500' : ''
                }`}
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === newPassword || 'Passwords do not match',
                })}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-primary"
            >
              {changePasswordMutation.isPending
                ? 'Changing...'
                : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive updates about your fees via email
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-primary-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Payment Reminders</p>
                <p className="text-sm text-gray-500">
                  Get reminded before fee due dates
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-primary-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">
                  Payment Confirmations
                </p>
                <p className="text-sm text-gray-500">
                  Receive confirmation after successful payments
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-primary-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">New Fee Assignments</p>
                <p className="text-sm text-gray-500">
                  Get notified when new fees are assigned
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-primary-600 rounded"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="btn-primary">Save Preferences</button>
          </div>
        </div>
      )}
    </div>
  );
}
