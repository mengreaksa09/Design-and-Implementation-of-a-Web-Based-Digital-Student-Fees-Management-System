import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function StudentView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const response = await api.get(`/students/${id}`);
      return response.data.data;
    },
  });

  // Fetch departments for display
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await api.get('/departments/list');
      return response.data.data;
    },
  });

  // Fetch courses for display
  const { data: coursesData } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/courses/list');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student not found</p>
        <button
          onClick={() => navigate('/admin/students')}
          className="mt-4 btn-primary"
        >
          Back to Students
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      graduated: 'bg-blue-100 text-blue-700',
      suspended: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/students')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Student Details
            </h1>
            <p className="text-gray-600">View student information</p>
          </div>
        </div>
        <Link
          to={`/admin/students/${id}/edit`}
          className="btn-primary flex items-center gap-2"
        >
          <PencilSquareIcon className="h-5 w-5" />
          Edit Student
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="card">
        <div className="flex items-start gap-6 p-6">
          <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-bold text-3xl">
              {student.user?.firstName?.charAt(0)}
              {student.user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {student.user?.firstName} {student.user?.lastName}
              </h2>
              {getStatusBadge(student.status)}
            </div>
            <p className="text-gray-500 mb-1">
              Student ID: {student.studentId}
            </p>
            <p className="text-gray-500">{student.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary-600" />
            Personal Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Full Name
            </label>
            <p className="mt-1 text-gray-900">
              {student.user?.firstName} {student.user?.lastName}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Gender
            </label>
            <p className="mt-1 text-gray-900 capitalize">
              {student.gender || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Date of Birth
            </label>
            <p className="mt-1 text-gray-900">
              {student.dateOfBirth ? formatDate(student.dateOfBirth) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              National ID
            </label>
            <p className="mt-1 text-gray-900">{student.nationalId || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Nationality
            </label>
            <p className="mt-1 text-gray-900">{student.nationality || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Religion
            </label>
            <p className="mt-1 text-gray-900">{student.religion || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-primary-600" />
            Contact Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Email
              </label>
              <p className="mt-1 text-gray-900">
                {student.user?.email || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Phone
              </label>
              <p className="mt-1 text-gray-900">
                {student.user?.phone || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Address
              </label>
              <p className="mt-1 text-gray-900">
                {student.address || 'N/A'}
                {student.city && `, ${student.city}`}
                {student.state && `, ${student.state}`}
                {student.country && `, ${student.country}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-primary-600" />
            Academic Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Study Level
            </label>
            <p className="mt-1 text-gray-900">{student.studyLevel || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Class
            </label>
            <p className="mt-1 text-gray-900">{student.class || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Department
            </label>
            <p className="mt-1 text-gray-900">
              {departmentsData?.find(d => d.id == student.department)?.name || student.department || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Course
            </label>
            <p className="mt-1 text-gray-900">
              {coursesData?.find(c => c.id == student.course)?.name || student.course || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Semester
            </label>
            <p className="mt-1 text-gray-900">{student.semester || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Academic Year
            </label>
            <p className="mt-1 text-gray-900">
              {student.academicYear || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Enrollment Date
            </label>
            <p className="mt-1 text-gray-900">
              {student.enrollmentDate
                ? formatDate(student.enrollmentDate)
                : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Campus
            </label>
            <p className="mt-1 text-gray-900">
              {student.campus?.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Study Time
            </label>
            <p className="mt-1 text-gray-900 capitalize">
              {student.studyTime || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Guardian Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-primary-600" />
            Guardian Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Guardian Name
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianName || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Relationship
            </label>
            <p className="mt-1 text-gray-900 capitalize">
              {student.guardianRelation || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Guardian Phone
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianPhone || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              Guardian Email
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianEmail || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      {student.feeAssignments && student.feeAssignments.length > 0 && (
        <div className="card">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
              Fee Assignments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fee Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {student.feeAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.feeStructure?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(assignment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(assignment.paidAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.dueDate
                        ? formatDate(assignment.dueDate)
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {assignment.status?.charAt(0).toUpperCase() +
                          assignment.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Info */}
      <div className="card">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Created At
              </label>
              <p className="mt-1 text-gray-900">
                {student.createdAt ? formatDate(student.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900">
                {student.updatedAt ? formatDate(student.updatedAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
