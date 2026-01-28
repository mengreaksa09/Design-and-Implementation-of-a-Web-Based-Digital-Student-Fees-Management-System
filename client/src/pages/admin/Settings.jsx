import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Cog6ToothIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [generalSettings, setGeneralSettings] = useState({
    institutionName: '',
    institutionEmail: '',
    institutionPhone: '',
    address: '',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    smsNotifications: false,
    paymentReminderDays: 7,
    lateFeeGracePeriod: 3,
  });

  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      if (response.data.data) {
        setGeneralSettings((prev) => ({ ...prev, ...response.data.data }));
      }
      return response.data.data;
    },
  });

  // Fetch activity logs
  const { data: activityLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: async () => {
      const response = await api.get('/settings/activity-logs');
      return response.data.data;
    },
    enabled: activeTab === 'logs',
  });

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'logs', label: 'Activity Logs', icon: ClockIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
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

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Institution Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Institution Name</label>
              <input
                type="text"
                className="input"
                value={generalSettings.institutionName}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    institutionName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={generalSettings.institutionEmail}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    institutionEmail: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={generalSettings.institutionPhone}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    institutionPhone: e.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea
                rows={2}
                className="input"
                value={generalSettings.address}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    address: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-6">
            System Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={generalSettings.currency}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    currency: e.target.value,
                  })
                }
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="NGN">NGN - Nigerian Naira</option>
              </select>
            </div>
            <div>
              <label className="label">Date Format</label>
              <select
                className="input"
                value={generalSettings.dateFormat}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    dateFormat: e.target.value,
                  })
                }
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="label">
                Payment Reminder (days before due)
              </label>
              <input
                type="number"
                className="input"
                value={generalSettings.paymentReminderDays}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    paymentReminderDays: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="label">Late Fee Grace Period (days)</label>
              <input
                type="number"
                className="input"
                value={generalSettings.lateFeeGracePeriod}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    lateFeeGracePeriod: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-6">
            Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.emailNotifications}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded text-primary-600"
              />
              <span>Enable email notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.smsNotifications}
                onChange={(e) =>
                  setGeneralSettings({
                    ...generalSettings,
                    smsNotifications: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded text-primary-600"
              />
              <span>Enable SMS notifications</span>
            </label>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => saveSettingsMutation.mutate(generalSettings)}
              disabled={saveSettingsMutation.isPending}
              className="btn-primary"
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {loadingLogs ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activityLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.User?.firstName} {log.User?.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
