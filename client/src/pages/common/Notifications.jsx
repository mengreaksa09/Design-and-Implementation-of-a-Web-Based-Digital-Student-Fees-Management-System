import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?read=${filter === 'read'}` : '';
      const response = await api.get(`/notifications${params}`);
      return response.data.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getIcon = (type) => {
    switch (type) {
      case 'payment':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-100',
        };
      case 'reminder':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
        };
      default:
        return { icon: BellIcon, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const unreadCount = data?.notifications?.filter((n) => !n.read).length || 0;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount > 1 ? 's' : ''
                }`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            <CheckIcon className="h-5 w-5" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'read', label: 'Read' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {data?.notifications?.length === 0 ? (
        <div className="card text-center py-12">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.notifications?.map((notification) => {
            const iconInfo = getIcon(notification.type);
            const IconComponent = iconInfo.icon;

            return (
              <div
                key={notification.id}
                className={`card transition-all ${
                  !notification.read
                    ? 'border-l-4 border-l-primary-600 bg-primary-50/50'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${iconInfo.bg}`}>
                    <IconComponent className={`h-6 w-6 ${iconInfo.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3
                          className={`font-medium ${
                            !notification.read
                              ? 'text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() =>
                              markAsReadMutation.mutate(notification.id)
                            }
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
