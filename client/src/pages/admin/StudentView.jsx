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
        <p className="text-gray-500">រកមិនឃើញគណនីនិស្សិតឡើយ</p>
        <button
          onClick={() => navigate('/admin/students')}
          className="mt-4 btn-primary"
        >
          ត្រឡប់ទៅការគ្រប់គ្រងនិស្សិត
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
    const labels = {
      active: 'សកម្ម',
      inactive: 'អសកម្ម',
      graduated: 'បញ្ចប់ការសិក្សា',
      suspended: 'ព្យួរការសិក្សា',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'
          }`}
      >
        {labels[status] || status || 'មិនមាន'}
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
              ព័ត៌មានលម្អិតរបស់និស្សិត
            </h1>
            <p className="text-gray-600">មើលព័ត៌មានលម្អិត និងកំណត់ត្រានិស្សិត</p>
          </div>
        </div>
        <Link
          to={`/admin/students/${id}/edit`}
          className="btn-primary flex items-center gap-2"
        >
          <PencilSquareIcon className="h-5 w-5" />
          កែសម្រួលព័ត៌មាននិស្សិត
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
              លេខសម្គាល់និស្សិត៖ {student.studentId}
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
            ព័ត៌មានផ្ទាល់ខ្លួន
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              នាមត្រកូល និងនាមខ្លួន (ខ្មែរ)
            </label>
            <p className="mt-1 text-gray-900 font-medium">
              {student.user?.firstName} {student.user?.lastName}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              អក្សរឡាតាំង
            </label>
            <p className="mt-1 text-gray-900 font-medium uppercase">
              {student.Full_Name || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ភេទ
            </label>
            <p className="mt-1 text-gray-900 font-medium">
              {student.gender === 'male' ? 'ប្រុស' : student.gender === 'female' ? 'ស្រី' : student.gender || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ថ្ងៃខែឆ្នាំកំណើត
            </label>
            <p className="mt-1 text-gray-900">
              {student.dateOfBirth ? formatDate(student.dateOfBirth) : 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              អត្តសញ្ញាណប័ណ្ណ
            </label>
            <p className="mt-1 text-gray-900">{student.nationalId || 'មិនមាន'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              សញ្ជាតិ
            </label>
            <p className="mt-1 text-gray-900">{student.nationality || 'មិនមាន'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              សាសនា
            </label>
            <p className="mt-1 text-gray-900">{student.religion || 'មិនមាន'}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-primary-600" />
            ព័ត៌មានទំនាក់ទំនង
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                អ៊ីមែល
              </label>
              <p className="mt-1 text-gray-900">
                {student.user?.email || 'មិនមាន'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                លេខទូរស័ព្ទ
              </label>
              <p className="mt-1 text-gray-900">
                {student.user?.phone || 'មិនមាន'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                អាសយដ្ឋាន
              </label>
              <p className="mt-1 text-gray-900">
                {student.address || 'មិនមាន'}
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
            ព័ត៌មានសិក្សា
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              កម្រិតសិក្សា
            </label>
            <p className="mt-1 text-gray-900">
              {student.studyLevel === 'Bachelor' ? 'បរិញ្ញាបត្រ' : student.studyLevel === 'Associate' ? 'អនុបណ្ឌិត' : student.studyLevel === 'Diploma' ? 'ឌីប្លូម' : student.studyLevel === 'Certificate' ? 'វិញ្ញាបនប័ត្រ' : student.studyLevel || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ឆ្នាំសិក្សា (ឆ្នាំទី)
            </label>
            <p className="mt-1 text-gray-900">
              {student.class === '1' ? 'ឆ្នាំទី១' : student.class === '2' ? 'ឆ្នាំទី២' : student.class === '3' ? 'ឆ្នាំទី៣' : student.class === '4' ? 'ឆ្នាំទី៤' : student.class === '5' ? 'ឆ្នាំទី៥' : student.class || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ជំនាញឯកទេស
            </label>
            <p className="mt-1 text-gray-900">
              {departmentsData?.find(d => d.id == student.department)?.name || student.department || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              មុខវិជ្ជា
            </label>
            <p className="mt-1 text-gray-900">
              {coursesData?.find(c => c.id == student.course)?.name || student.course || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ឆមាស
            </label>
            <p className="mt-1 text-gray-900">
              {student.semester === '1st' ? 'ឆមាសទី១' : student.semester === '2nd' ? 'ឆមាសទី២' : student.semester || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ឆ្នាំសិក្សា
            </label>
            <p className="mt-1 text-gray-900">
              {student.academicYear || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ថ្ងៃចូលរៀន
            </label>
            <p className="mt-1 text-gray-900">
              {student.enrollmentDate
                ? formatDate(student.enrollmentDate)
                : 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              មណ្ឌលសិក្សា
            </label>
            <p className="mt-1 text-gray-900">
              {student.campus?.name || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              វេនសិក្សា
            </label>
            <p className="mt-1 text-gray-900">
              {student.studyTime === 'morning' ? 'ព្រឹក' : student.studyTime === 'afternoon' ? 'រសៀល' : student.studyTime === 'evening' ? 'យប់' : student.studyTime === 'weekend' ? 'សៅរ៍-អាទិត្យ' : student.studyTime || 'មិនមាន'}
            </p>
          </div>
        </div>
      </div>

      {/* Guardian Information */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-primary-600" />
            ព័ត៌មានអាណាព្យាបាល
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ឈ្មោះអាណាព្យាបាល
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianName || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ត្រូវជា (ទំនាក់ទំនង)
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianRelation || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              ទូរស័ព្ទអាណាព្យាបាល
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianPhone || 'មិនមាន'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">
              អ៊ីមែលអាណាព្យាបាល
            </label>
            <p className="mt-1 text-gray-900">
              {student.guardianEmail || 'មិនមាន'}
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
              កំណត់ត្រាការបង់ថ្លៃសិក្សា
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ប្រភេទថ្លៃសិក្សា
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    តម្លៃសរុប
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    បានបង់
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    កាលបរិច្ឆេទកំណត់បង់
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ស្ថានភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {student.feeAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.feeStructure?.name || 'មិនមាន'}
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
                        : 'មិនមាន'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {assignment.status === 'paid'
                          ? 'បង់រួចរាល់'
                          : assignment.status === 'partial'
                            ? 'បង់មួយផ្នែក'
                            : 'មិនទាន់បង់'}
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
                ថ្ងៃបង្កើតគណនី
              </label>
              <p className="mt-1 text-gray-900">
                {student.createdAt ? formatDate(student.createdAt) : 'មិនមាន'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ
              </label>
              <p className="mt-1 text-gray-900">
                {student.updatedAt ? formatDate(student.updatedAt) : 'មិនមាន'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
