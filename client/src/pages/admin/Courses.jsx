import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function Courses() {
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    courseId: null,
    courseName: '',
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    departmentId: '',
    credits: '3',
    duration: '4',
    level: 'undergraduate',
    tuitionFee: '',
    admissionRequirements: '',
    maxStudents: '',
    coordinator: '',
    accreditation: '',
  });

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

  // Format tuition fee with commas and .00
  const formatTuitionFee = (value) => {
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

  // Format tuition fee with .00 on blur
  const formatTuitionFeeComplete = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const formattedInteger = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedInteger + '.00';
  };

  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departmentsList'],
    queryFn: async () => {
      const response = await api.get('/departments/list');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/courses', data),
    onSuccess: () => {
      toast.success('Course created successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/courses/${id}`, data),
    onSuccess: () => {
      toast.success('Course updated successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update course');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    },
  });

  const openModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        code: course.code,
        name: course.name,
        description: course.description || '',
        departmentId: course.departmentId,
        credits: course.credits.toString(),
        duration: course.duration.toString(),
        level: course.level,
        tuitionFee: course.tuitionFee ? formatTuitionFee(course.tuitionFee.toString()) : '',
        admissionRequirements: course.admissionRequirements || '',
        maxStudents: course.maxStudents || '',
        coordinator: course.coordinator || '',
        accreditation: course.accreditation || '',
      });
    } else {
      setEditingCourse(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        departmentId: '',
        credits: '3',
        duration: '4',
        level: 'undergraduate',
        tuitionFee: '',
        admissionRequirements: '',
        maxStudents: '',
        coordinator: '',
        accreditation: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      credits: parseInt(formData.credits),
      duration: parseInt(formData.duration),
      tuitionFee: formData.tuitionFee ? parseFloat(formData.tuitionFee.replace(/,/g, '')) : null,
      maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (course) => {
    setConfirmModal({
      isOpen: true,
      courseId: course.id,
      courseName: course.name,
    });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(confirmModal.courseId);
    setConfirmModal({ isOpen: false, courseId: null, courseName: '' });
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
          <h1 className="text-2xl font-bold text-gray-900">មុខវិជ្ជា (Courses)</h1>
          <p className="text-gray-600">គ្រប់គ្រងមុខវិជ្ជានានា</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          បន្ថែមមុខវិជ្ជា
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${course.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}
              >
                {course.isActive ? 'សកម្ម' : 'អសកម្ម'}
              </span>
            </div>

            {course.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">ជំនាញឯកទេស:</span>
                <span className="ml-2 text-gray-900">
                  {course.department?.name}
                </span>
              </div>
              <div className="text-sm flex gap-4">
                <div>
                  <span className="text-gray-500">រយៈពេល:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {course.duration} years
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ក្រេដី:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {course.credits}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">កម្រិត:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {course.level}
                </span>
              </div>
              {course.tuitionFee && (
                <div className="text-sm">
                  <span className="text-gray-500">ថ្លៃសិក្សា:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    ${parseFloat(course.tuitionFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => openModal(course)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <PencilSquareIcon className="h-4 w-4" />
                កែប្រែ
              </button>
              <button
                onClick={() => handleDelete(course)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCourse ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជា'}
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
                    លេខកូដមុខវិជ្ជា (Course Code) *
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
                    placeholder="CS101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ឈ្មោះមុខវិជ្ជា (Course Name) *
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
                    setFormData({ ...formData, description: capitalizeFirst(e.target.value) })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the course"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ជំនាញឯកទេស (Department) *
                  </label>
                  <select
                    required
                    defaultValue=""
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>ជ្រើសរើសជំនាញឯកទេស</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    កម្រិត (Level) *
                  </label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="doctorate">Doctorate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    រយៈពេល (ឆ្នាំ) (Duration Years) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ក្រេដី (Credits) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({ ...formData, credits: e.target.value })
                    }
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ថ្លៃសិក្សា (Tuition Fee USD)
                  </label>
                  <input
                    type="text"
                    value={formData.tuitionFee}
                    onChange={(e) =>
                      setFormData({ ...formData, tuitionFee: formatTuitionFee(e.target.value) })
                    }
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, tuitionFee: formatTuitionFeeComplete(e.target.value) })
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5,000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    អ្នកសម្របស្រប (Coordinator)
                  </label>
                  <input
                    type="text"
                    value={formData.coordinator}
                    onChange={(e) =>
                      setFormData({ ...formData, coordinator: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ចំនួននិស្សិតអទិទ្ធ (Max Students)
                  </label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStudents: e.target.value })
                    }
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  លក្ខខណ្ឌការចូលរួម (Admission Requirements)
                </label>
                <textarea
                  value={formData.admissionRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admissionRequirements: capitalizeFirst(e.target.value),
                    })
                  }
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="High school diploma or equivalent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ស្នាំស្គាល់ (Accreditation)
                </label>
                <input
                  type="text"
                  value={formData.accreditation}
                  onChange={(e) =>
                    setFormData({ ...formData, accreditation: capitalizeFirst(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Accredited by..."
                />
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
                    : editingCourse
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
          setConfirmModal({ isOpen: false, courseId: null, courseName: '' })
        }
        onConfirm={confirmDelete}
        title="លុបមុខវិជ្ជា"
        message={`តើអ្នកពិតជាចង់លុប "${confirmModal.courseName}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`}
      />
    </div>
  );
}
