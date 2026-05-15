import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

export default function Departments() {
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    departmentId: null,
    departmentName: '',
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    headOfDepartment: '',
    email: '',
    phone: '',
    location: '',
    establishedYear: '',
    facultyCount: '',
    studentCapacity: '',
  });

  // Format phone number: +855 XX XXX XXX XXX
  const formatPhoneNumber = (value) => {
    // If empty or just starting to type, set default prefix
    if (!value || value.length === 0) {
      return '+855 ';
    }

    // Remove all spaces
    let cleaned = value.replace(/\s/g, '');

    // Ensure it starts with +855
    if (!cleaned.startsWith('+855')) {
      cleaned = '+855' + cleaned.replace(/^\+?\d{0,3}/, '');
    }

    // Format: +855 XX XXX XXX XXX
    const prefix = '+855';
    const digits = cleaned.slice(4); // Get digits after +855

    if (digits.length === 0) {
      return prefix + ' ';
    }

    // Format as: XX XXX XXX XXX (2 digits, space, 3 digits, space, 3 digits, space, 3 digits)
    let formatted = prefix + ' ';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5 || i === 8) {
        formatted += ' ';
      }
      formatted += digits[i];
    }

    return formatted;
  };

  // Capitalize each word except common words
  const capitalizeWords = (str) => {
    const lowerCaseWords = ['and', 'or', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with'];
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

  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/departments', data),
    onSuccess: () => {
      toast.success('Department created successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to create department'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/departments/${id}`, data),
    onSuccess: () => {
      toast.success('Department updated successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update department'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      toast.success('Department deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete department'
      );
    },
  });

  const openModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        code: department.code,
        name: department.name,
        description: department.description || '',
        headOfDepartment: department.headOfDepartment || '',
        email: department.email || '',
        phone: department.phone || '',
        location: department.location || '',
        establishedYear: department.establishedYear || '',
        facultyCount: department.facultyCount || '',
        studentCapacity: department.studentCapacity || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        headOfDepartment: '',
        email: '',
        phone: '',
        location: '',
        establishedYear: '',
        facultyCount: '',
        studentCapacity: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      establishedYear: formData.establishedYear
        ? parseInt(formData.establishedYear)
        : null,
      facultyCount: formData.facultyCount ? parseInt(formData.facultyCount) : 0,
      studentCapacity: formData.studentCapacity
        ? parseInt(formData.studentCapacity)
        : null,
    };

    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (department) => {
    setConfirmModal({
      isOpen: true,
      departmentId: department.id,
      departmentName: department.name,
    });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(confirmModal.departmentId);
    setConfirmModal({ isOpen: false, departmentId: null, departmentName: '' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ជំនាញឯកទេស (Departments)</h1>
          <p className="text-gray-600">គ្រប់គ្រងជំនាញឯកទេសនានា</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          បន្ថែមជំនាញឯកទេស
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments?.map((department) => (
          <div
            key={department.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {department.name}
                  </h3>
                  <p className="text-sm text-gray-500">{department.code}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${department.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}
              >
                {department.isActive ? 'សកម្ម' : 'អសកម្ម'}
              </span>
            </div>

            {department.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {department.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {department.headOfDepartment && (
                <div className="text-sm">
                  <span className="text-gray-500">ប្រធាន:</span>
                  <span className="ml-2 text-gray-900">
                    {department.headOfDepartment}
                  </span>
                </div>
              )}
              {department.location && (
                <div className="text-sm">
                  <span className="text-gray-500">ទីតាំង:</span>
                  <span className="ml-2 text-gray-900">
                    {department.location}
                  </span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-gray-500">មុខវិជ្ជា:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {department.courses?.length || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => openModal(department)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <PencilSquareIcon className="h-4 w-4" />
                កែប្រែ
              </button>
              <button
                onClick={() => handleDelete(department)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <TrashIcon className="h-4 w-4" />
                លុប
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingDepartment ? 'កែប្រែជំនាញឯកទេស' : 'បន្ថែមជំនាញឯកទេស'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    លេខកូដជំនាញ (Department Code) *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CS, ENG"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ឈ្មោះជំនាញឯកទេស (Department Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: capitalizeWords(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ការពិពណ៌នា (Description)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the department"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ប្រធានជំនាញឯកទេស (Head of Department)
                  </label>
                  <input
                    type="text"
                    value={formData.headOfDepartment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        headOfDepartment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ទីតាំង (Location)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Building A, Floor 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    អ៊ីមែល (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value.toLowerCase() })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="dept@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    លេខទូរស័ព្ទ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                    }
                    onFocus={(e) => {
                      if (!e.target.value) {
                        setFormData({ ...formData, phone: '+855 ' });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+855 12 345 678"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ឆ្នាំបង្កើត (Established Year)
                  </label>
                  <input
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        establishedYear: e.target.value,
                      })
                    }
                    min="1900"
                    max="2100"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ចំនួនគ្រូបង្រៀន (Faculty Count)
                  </label>
                  <input
                    type="number"
                    value={formData.facultyCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facultyCount: e.target.value,
                      })
                    }
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    សមត្ថភាពដាក់និស្សិត (Student Capacity)
                  </label>
                  <input
                    type="number"
                    value={formData.studentCapacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        studentCapacity: e.target.value,
                      })
                    }
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'កំពុងរក្សាទុក...'
                    : editingDepartment
                      ? 'ធ្វើបច្ចុប្បន្នភាព'
                      : 'បង្កើត'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            departmentId: null,
            departmentName: '',
          })
        }
        onConfirm={confirmDelete}
        title="លុបជំនាញឯកទេស"
        message={`តើអ្នកពិតជាចង់លុប "${confirmModal.departmentName}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`}
      />
    </div>
  );
}
