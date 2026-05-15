import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function FeeStructures() {
  // Capitalize each word except common small words
  const capitalizeWords = (str) => {
    const lowerCaseWords = ['and', 'or', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an'];
    return str.split(' ').map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Don't capitalize common words
      if (lowerCaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      // Capitalize other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  // Capitalize first letter only
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Format amount with commas and .00
  const formatAmount = (value) => {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');

    // If empty, return empty
    if (!cleaned) return '';

    // Split into integer and decimal parts
    const parts = cleaned.split('.');
    const integerPart = parts[0];

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Return formatted value (without .00 during typing)
    return formattedInteger;
  };

  // Format amount with .00 on blur
  const formatAmountComplete = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const formattedInteger = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedInteger + '.00';
  };

  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    feeId: null,
    feeName: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    feeType: '',
    amount: '',
    frequency: 'one-time',
    dueDay: '',
    lateFeeType: 'fixed',
    lateFeeValue: '',
    gracePeriod: '7',
    department: '',
    course: '',
  });

  const queryClient = useQueryClient();

  const { data: fees, isLoading } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: async () => {
      const response = await api.get('/fees/structures?isActive=true');
      return response.data.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data.data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/fees/structures', data),
    onSuccess: () => {
      toast.success('Fee structure created successfully');
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to create fee structure'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/fees/structures/${id}`, data),
    onSuccess: () => {
      toast.success('Fee structure updated successfully');
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update fee structure'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/fees/structures/${id}`),
    onSuccess: () => {
      toast.success('Fee structure deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete fee structure'
      );
    },
  });

  const openModal = (fee = null) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        name: fee.name,
        description: fee.description || '',
        feeType: fee.feeType || '',
        amount: fee.amount,
        frequency: fee.frequency,
        dueDay: fee.dueDay || '',
        lateFeeType: fee.lateFeeType || 'fixed',
        lateFeeValue: fee.lateFeeValue || '',
        gracePeriod: fee.gracePeriod || '7',
        department: fee.department || '',
        course: fee.course || '',
      });
    } else {
      setEditingFee(null);
      setFormData({
        name: '',
        description: '',
        feeType: '',
        amount: '',
        frequency: 'one-time',
        dueDay: '',
        lateFeeType: 'fixed',
        lateFeeValue: '',
        gracePeriod: '7',
        department: '',
        course: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFee(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean the amount by removing commas and converting to number
    const cleanedData = {
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount.replace(/,/g, '')) : 0,
      lateFeeValue: formData.lateFeeValue ? parseFloat(formData.lateFeeValue) : 0,
      gracePeriod: formData.gracePeriod ? parseInt(formData.gracePeriod) : 7,
      dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
    };

    if (editingFee) {
      updateMutation.mutate({ id: editingFee.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({ isOpen: true, feeId: id, feeName: name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(confirmModal.feeId);
    setConfirmModal({ isOpen: false, feeId: null, feeName: '' });
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      'one-time': 'bg-gray-100 text-gray-700',
      monthly: 'bg-blue-100 text-blue-700',
      quarterly: 'bg-purple-100 text-purple-700',
      semester: 'bg-orange-100 text-orange-700',
      annually: 'bg-green-100 text-green-700',
      year: 'bg-teal-100 text-teal-700',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[frequency]}`}
      >
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">រចនាសម្ព័ន្ធបង់ថ្លៃ (Fee Structures)</h1>
          <p className="text-gray-600">
            កំណត់ និងគ្រប់គ្រងប្រភេទបង់ថ្លៃសម្រាប់ស្ថាប័នរបស់អ្នក
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          បន្ថែមរចនាសម្ព័ន្ធបង់ថ្លៃ
        </button>
      </div>

      {/* Fee Structures Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : fees?.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">មិនទាន់មានរចនាសម្ព័ន្ធបង់ថ្លៃទេ</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-primary-600 hover:text-primary-500 font-medium"
          >
            បង្កើតរចនាសម្ព័ន្ធថ្លៃដំបូងរបស់អ្នក →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fees?.map((fee) => (
            <div
              key={fee.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fee.name}
                  </h3>
                  {getFrequencyBadge(fee.frequency)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(fee)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(fee.id, fee.name)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(fee.amount)}
              </p>

              {fee.description && (
                <p className="text-sm text-gray-600 mb-4">{fee.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {fee.lateFeeValue > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>ថ្លៃយឺត់:</span>
                    <span>
                      {fee.lateFeeType === 'percentage'
                        ? `${fee.lateFeeValue}%`
                        : formatCurrency(fee.lateFeeValue)}
                    </span>
                  </div>
                )}
                {fee.gracePeriod > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>រយៈពេលរ៉ោយរ៉ោ:</span>
                    <span>{fee.gracePeriod} days</span>
                  </div>
                )}
                {fee.department && (
                  <div className="flex justify-between text-gray-600">
                    <span>ជំនាញឯកទេស:</span>
                    <span>{fee.department}</span>
                  </div>
                )}
                {fee.course && (
                  <div className="flex justify-between text-gray-600">
                    <span>មុខវិជ្ជា:</span>
                    <span>{fee.course}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFee ? 'កែប្រែរចនាសម្ព័ន្ធបង់ថ្លៃ' : 'បន្ថែមរចនាសម្ព័ន្ធថ្លៃ'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">ឈ្មោះបង់ថ្លៃ (Fee Name) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Tuition Fee, Lab Fee"
                    autoFocus
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: capitalizeWords(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">ប្រភេទបង់ថ្លៃ (Fee Type) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Academic, Administrative"
                    value={formData.feeType}
                    onChange={(e) =>
                      setFormData({ ...formData, feeType: capitalizeFirst(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">ចំនួនបង់ថ្លៃ (Amount USD) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 500.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: formatAmount(e.target.value) })
                    }
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, amount: formatAmountComplete(e.target.value) })
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="label">ប្រហែល (Frequency) *</label>
                  <select
                    className="input"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    required
                  >
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semester">Semester</option>
                    <option value="annually">Annually</option>
                    <option value="year">Year</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">ការពិពណ៌នា (Description)</label>
                  <textarea
                    rows={2}
                    className="input"
                    placeholder="Enter a brief description of this fee (optional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: capitalizeFirst(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="label">ថ្ងៃកំណត់នៃខែ (Due Day of Month)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="input"
                    placeholder="e.g., 15"
                    value={formData.dueDay}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDay: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">រយៈពេលរ៉ោយរ៉ោ (ថ្ងៃ) (Grace Period days)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="e.g., 7"
                    value={formData.gracePeriod}
                    onChange={(e) =>
                      setFormData({ ...formData, gracePeriod: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">ប្រភេទបង់ថ្លៃយឺត (Late Fee Type)</label>
                  <select
                    className="input"
                    value={formData.lateFeeType}
                    onChange={(e) =>
                      setFormData({ ...formData, lateFeeType: e.target.value })
                    }
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    ថ្លៃយឺត{' '}
                    {formData.lateFeeType === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder={formData.lateFeeType === 'percentage' ? 'e.g., 5' : 'e.g., 25.00'}
                    value={formData.lateFeeValue}
                    onChange={(e) =>
                      setFormData({ ...formData, lateFeeValue: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label">ជំនាញឯកទេស (Department)</label>
                  <select
                    className="input"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        course: e.target.value,
                      })
                    }
                  >
                    <option value="">ជ្រើសរើសជំនាញឯកទេស
                    </option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ទុកទទេដើម្បីអនុវត្តទៅជំនាញឯកទេសទាំងអស់
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="btn-primary"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'កំពុងរក្សាទុក...'
                    : editingFee
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
          setConfirmModal({ isOpen: false, feeId: null, feeName: '' })
        }
        onConfirm={confirmDelete}
        title="លុបរចនាសម្ព័ន្ធទឹកថ្លៃ"
        message={`តើអ្នកពិតជាចង់លុប "${confirmModal.feeName}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`}
        confirmText="លុប"
        type="danger"
      />
    </div>
  );
}
