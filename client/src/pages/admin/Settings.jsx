import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Cog6ToothIcon,
  ClockIcon,
  BuildingOfficeIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
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
      toast.success('បានរក្សាទុកការកំណត់ដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'ការរក្សាទុកការកំណត់បានបរាជ័យ');
    },
  });

  const tabs = [
    { id: 'general', label: 'ការកំណត់ទូទៅ', icon: Cog6ToothIcon },
    { id: 'logs', label: 'កំណត់ហេតុសកម្មភាព', icon: ClockIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
          <Cog6ToothIcon className="h-8 w-8 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">ការកំណត់</h1>
          <p className="text-gray-500 text-base mt-0.5">
            គ្រប់គ្រងការកំណត់រចនាសម្ព័ន្ធ និងចំណូលចិត្តទូទៅរបស់ប្រព័ន្ធ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 -mb-px transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 scale-[1.02]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Info & Preferences */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Institution Information Card */}
              <div className="card space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      ព័ត៌មានស្ថាប័ន
                    </h3>
                    <p className="text-sm text-gray-500">កំណត់ឈ្មោះ លេខទំនាក់ទំនង និងអាសយដ្ឋានផ្លូវការ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">ឈ្មោះស្ថាប័ន</label>
                    <input
                      type="text"
                      className="input focus:ring-primary-500"
                      value={generalSettings.institutionName}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          institutionName: e.target.value,
                        })
                      }
                      placeholder="ឧទាហរណ៍៖ សាកលវិទ្យាល័យជាតិ..."
                    />
                  </div>
                  <div>
                    <label className="label">អ៊ីមែល</label>
                    <input
                      type="email"
                      className="input focus:ring-primary-500"
                      value={generalSettings.institutionEmail}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          institutionEmail: e.target.value,
                        })
                      }
                      placeholder="info@institution.edu.kh"
                    />
                  </div>
                  <div>
                    <label className="label">លេខទូរស័ព្ទ</label>
                    <input
                      type="tel"
                      className="input focus:ring-primary-500"
                      value={generalSettings.institutionPhone}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          institutionPhone: e.target.value,
                        })
                      }
                      placeholder="+855 12 345 678"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">អាសយដ្ឋាន</label>
                    <textarea
                      rows={3}
                      className="input focus:ring-primary-500"
                      value={generalSettings.address}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          address: e.target.value,
                        })
                      }
                      placeholder="បញ្ចូលអាសយដ្ឋានពេញលេញរបស់ស្ថាប័ន..."
                    />
                  </div>
                </div>
              </div>

              {/* System Preferences Card */}
              <div className="card space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <AdjustmentsHorizontalIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      ចំណូលចិត្តប្រព័ន្ធ
                    </h3>
                    <p className="text-sm text-gray-500">កំណត់រូបិយប័ណ្ណ ទម្រង់កាលបរិច្ឆេទ និងលក្ខខណ្ឌហិរញ្ញវត្ថុ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">រូបិយប័ណ្ណ</label>
                    <select
                      className="input focus:ring-primary-500"
                      value={generalSettings.currency}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          currency: e.target.value,
                        })
                      }
                    >
                      <option value="USD">USD - ដុល្លារអាមេរិក</option>
                      <option value="KHR">KHR - រៀលខ្មែរ</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">ទម្រង់កាលបរិច្ឆេទ</label>
                    <select
                      className="input focus:ring-primary-500"
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
                      ការរំលឹកការបង់ប្រាក់ (ថ្ងៃមុនកាលកំណត់)
                    </label>
                    <input
                      type="number"
                      className="input focus:ring-primary-500"
                      value={generalSettings.paymentReminderDays}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          paymentReminderDays: e.target.value,
                        })
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">រយៈពេលអនុគ្រោះថ្លៃយឺតយ៉ាវ (ថ្ងៃ)</label>
                    <input
                      type="number"
                      className="input focus:ring-primary-500"
                      value={generalSettings.lateFeeGracePeriod}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          lateFeeGracePeriod: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Notifications & Save */}
            <div className="space-y-6">
              
              {/* Notifications Card */}
              <div className="card space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <BellIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      ការជូនដំណឹង
                    </h3>
                    <p className="text-sm text-gray-500">កំណត់ប្រព័ន្ធផ្ញើសារជូនដំណឹងស្វ័យប្រវត្តិ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email Notification Row */}
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors duration-150">
                    <input
                      type="checkbox"
                      checked={generalSettings.emailNotifications}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="h-5 w-5 rounded text-primary-600 border-gray-300 focus:ring-primary-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 text-sm">អ៊ីមែល</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ផ្ញើការរំលឹកការទូទាត់ និងបង្កាន់ដៃតាមរយៈអ៊ីមែល</p>
                    </div>
                  </label>

                  {/* SMS Notification Row */}
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors duration-150">
                    <input
                      type="checkbox"
                      checked={generalSettings.smsNotifications}
                      onChange={(e) =>
                        setGeneralSettings({
                          ...generalSettings,
                          smsNotifications: e.target.checked,
                        })
                      }
                      className="h-5 w-5 rounded text-primary-600 border-gray-300 focus:ring-primary-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 text-sm">សារទូរស័ព្ទ</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ផ្ញើសារទូទាត់ ឬការជូនដំណឹងបន្ទាន់តាមរយៈទូរស័ព្ទដៃ</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Card */}
              <div className="card bg-gray-50/50 border border-dashed border-gray-200 flex flex-col gap-4 items-center justify-center p-6 text-center">
                <div className="p-3 bg-white rounded-full shadow-sm text-primary-600">
                  <CheckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">រក្សាទុកការកំណត់</h4>
                  <p className="text-sm text-gray-500 mt-1">សូមប្រាកដថាព័ត៌មានទាំងអស់ត្រូវបានបញ្ចូលត្រឹមត្រូវ មុនពេលចុចរក្សាទុក។</p>
                </div>
                <button
                  onClick={() => saveSettingsMutation.mutate(generalSettings)}
                  disabled={saveSettingsMutation.isPending}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all duration-150"
                >
                  {saveSettingsMutation.isPending ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                សកម្មភាពថ្មីៗ
              </h3>
              <p className="text-sm text-gray-500">កំណត់ត្រាសកម្មភាព និងប្រតិបត្តិការដែលបានធ្វើឡើងក្នុងប្រព័ន្ធ</p>
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider border-b">
                      អ្នកប្រើប្រាស់ (User)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider border-b">
                      សកម្មភាព (Action)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider border-b">
                      ព័ត៌មានលម្អិត (Details)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider border-b">
                      អាសយដ្ឋាន IP (IP Address)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider border-b">
                      កាលបរិច្ឆេទ (Date)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activityLogs?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                        មិនមានប្រវត្តិកំណត់ត្រាសកម្មភាពណាមួយឡើយ
                      </td>
                    </tr>
                  ) : (
                    activityLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                              {log.User?.firstName?.charAt(0)}
                              {log.User?.lastName?.charAt(0)}
                            </div>
                            <span>{log.User?.firstName} {log.User?.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
