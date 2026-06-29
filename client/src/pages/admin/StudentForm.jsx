import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// ─────────────────────────────────────────────────────────────────
// Helper: convert ISO date → DD/MM/YYYY for display
// ─────────────────────────────────────────────────────────────────
function isoToDMY(iso) {
  if (!iso || !iso.includes('-')) return '';
  const parts = iso.split('T')[0].split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ─────────────────────────────────────────────────────────────────
// Loader – fetches data, then renders the form with correct defaults
// ─────────────────────────────────────────────────────────────────
export default function StudentForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Departments always needed (for the select options)
  const { data: departmentsData, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => (await api.get('/departments/list')).data.data,
    staleTime: 30_000,
  });

  // Student data (edit mode only)
  const { data: existingStudent, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-edit', id],
    queryFn: async () => (await api.get(`/students/${id}`)).data.data,
    enabled: isEditMode,
    staleTime: 0,
    gcTime: 0,
  });

  // Students count (create mode only – for auto-ID)
  const { data: studentsCount } = useQuery({
    queryKey: ['studentsCount'],
    queryFn: async () => {
      const r = await api.get('/students?limit=1&page=1&includeAll=true');
      return r.data.pagination?.total || 0;
    },
    enabled: !isEditMode,
    staleTime: 0,
  });

  // Block render until we have everything we need
  const isReady = isEditMode
    ? existingStudent && departmentsData && !loadingStudent && !loadingDepts
    : departmentsData && !loadingDepts;

  if (!isReady) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/students')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'កែប្រែទិន្នន័យនិស្សិត' : 'បញ្ចូលនិស្សិតថ្មី'}
            </h1>
            <p className="text-gray-600">កំពុងផ្ទុកទិន្នន័យ...</p>
          </div>
        </div>
        <div className="card p-12 flex flex-col justify-center items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="text-gray-500 text-sm">សូមរង់ចាំ...</p>
        </div>
      </div>
    );
  }

  // Compute defaultValues from existing student (edit) or fresh (create)
  let defaultValues;
  if (isEditMode && existingStudent) {
    const s = existingStudent;
    const u = s.user || {};
    const [ayStart = '', ayEnd = ''] = (s.academicYear || '').split('-');
    defaultValues = {
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      latinName: s.Full_Name || '',
      dateOfBirth: isoToDMY(s.dateOfBirth),
      gender: s.gender || '',
      phone: u.phone || '',
      email: u.email || '',
      password: '',
      department: s.department ? String(s.department) : '',
      course: s.course || '',
      generation: s.generation || '',
      batch: s.batch || '',
      class: s.class ? String(s.class) : '',
      semester: s.semester || '',
      studyLevel: s.studyLevel || '',
      studyShift: s.studyShift || 'morning',
      academicYearStart: ayStart,
      academicYearEnd: ayEnd,
      academicYear: s.academicYear || '',
      feeDiscount: s.feeDiscount != null ? s.feeDiscount : 0,
      studentId: s.studentId || '',
    };
  } else {
    const nextId = studentsCount !== undefined
      ? `STU${String(studentsCount + 1).padStart(6, '0')}`
      : '';
    defaultValues = {
      firstName: '', lastName: '', latinName: '', dateOfBirth: '',
      gender: '', phone: '', email: '', password: '',
      department: '', course: '', generation: '', batch: '',
      class: '', semester: '', studyLevel: '', studyShift: 'morning',
      academicYearStart: '', academicYearEnd: '', academicYear: '',
      feeDiscount: 0, studentId: nextId,
    };
  }

  // Render the actual form with a key so React fully remounts it with the right defaults
  return (
    <StudentFormInner
      key={isEditMode ? `edit-${id}` : 'create'}
      isEditMode={isEditMode}
      studentId={id}
      existingStudent={existingStudent}
      departmentsData={departmentsData}
      defaultValues={defaultValues}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Inner Form – receives computed defaultValues, no async data needed
// ─────────────────────────────────────────────────────────────────
function StudentFormInner({
  isEditMode,
  studentId,
  existingStudent,
  departmentsData,
  defaultValues,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues });

  const latinName = watch('latinName');
  const phone = watch('phone');
  const selectedDepartment = watch('department');

  // Auto-sync course with department (create only)
  useEffect(() => {
    if (!isEditMode && selectedDepartment && departmentsData) {
      const dept = departmentsData.find(d => String(d.id) === String(selectedDepartment));
      if (dept) setValue('course', dept.name, { shouldValidate: true });
    }
  }, [selectedDepartment, departmentsData, setValue, isEditMode]);

  // Auto-generate password (create only)
  useEffect(() => {
    if (!isEditMode && latinName && phone && phone.length >= 3) {
      const cleanLatin = latinName.toLowerCase().trim().replace(/\s+/g, '.');
      setValue('password', `${cleanLatin}@${phone.slice(-3)}`);
    }
  }, [latinName, phone, setValue, isEditMode]);

  // ── Helpers ──────────────────────────────────────────────────────
  const handleEmailBlur = (e) => {
    const v = e.target.value;
    if (v && !v.includes('@')) setValue('email', `${v}@gmail.com`);
  };

  const handlePhoneFormat = (e, fieldName) => {
    let value = e.target.value;
    if (!value) { setValue(fieldName, '+855 '); return; }
    let cleaned = value.replace(/\s/g, '');
    if (!cleaned.startsWith('+855')) cleaned = '+855' + cleaned.replace(/^\+?\d{0,3}/, '');
    const digits = cleaned.slice(4);
    if (!digits) { setValue(fieldName, '+855 '); return; }
    let formatted = '+855 ';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5) formatted += ' ';
      formatted += digits[i];
    }
    setValue(fieldName, formatted);
  };

  const handleDateFormat = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    let f = '';
    if (v.length >= 1) {
      let day = v.slice(0, 2);
      if (v.length === 1 && parseInt(v) > 3) { day = '0' + v; v = day + v.slice(1); }
      f = day;
    }
    if (v.length >= 3) {
      let month = v.slice(2, 4);
      if (v.length === 3 && parseInt(v.slice(2, 3)) > 1) { month = '0' + v.slice(2, 3); v = v.slice(0, 2) + month + v.slice(3); }
      f = f.slice(0, 2) + '/' + month;
    }
    if (v.length >= 5) f = f.slice(0, 5) + '/' + v.slice(4, 8);
    e.target.value = f;
  };

  // ── Mutations ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/students', data),
    onSuccess: () => {
      toast.success('បានបន្ថែមនិស្សិតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/admin/students');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'មានបញ្ហាក្នុងការបន្ថែម'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/students/${studentId}`, data),
    onSuccess: () => {
      toast.success('បានកែប្រែទិន្នន័យនិស្សិតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-edit', studentId] });
      navigate('/admin/students');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'មានបញ្ហាក្នុងការកែប្រែ'),
  });

  const mutation = isEditMode ? updateMutation : createMutation;

  const onSubmit = (data) => {
    if (data.dateOfBirth) {
      const p = data.dateOfBirth.split('/');
      if (p.length === 3) data.dateOfBirth = `${p[2]}-${p[1]}-${p[0]}`;
    }
    mutation.mutate(data);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'កែប្រែទិន្នន័យនិស្សិត' : 'បញ្ចូលនិស្សិតថ្មី'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? `${existingStudent?.user?.firstName || ''} ${existingStudent?.user?.lastName || ''} — ${existingStudent?.studentId || ''}`
              : 'សូមបំពេញព័ត៌មានលម្អិតខាងក្រោម'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Personal Info ─────────────────────────────────────── */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ពត៌មានផ្ទាល់ខ្លួននិស្សិត</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">

            {/* នាមត្រកូល */}
            <div className="md:col-span-3">
              <label className="label">នាមត្រកូល *</label>
              <input
                type="text"
                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="ឧ. ចាន់"
                {...register('firstName', { required: 'ត្រូវបំពេញនាមត្រកូល' })}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
            </div>

            {/* នាមខ្លួន */}
            <div className="md:col-span-3">
              <label className="label">នាមខ្លួន *</label>
              <input
                type="text"
                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="ឧ. សុខ"
                {...register('lastName', { required: 'ត្រូវបំពេញនាមខ្លួន' })}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
            </div>

            {/* អក្សរឡាតាំង */}
            <div className="md:col-span-3">
              <label className="label">អក្សរឡាតាំង *</label>
              <input
                type="text"
                className={`input ${errors.latinName ? 'border-red-500' : ''}`}
                placeholder="ឧ. CHAN SOK"
                {...register('latinName', { required: 'ត្រូវបំពេញអក្សរឡាតាំង' })}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  setValue('latinName', e.target.value);
                }}
              />
              {errors.latinName && <p className="mt-1 text-sm text-red-500">{errors.latinName.message}</p>}
            </div>

            {/* ថ្ងៃខែឆ្នាំកំណើត */}
            <div className="md:col-span-3">
              <label className="label">ថ្ងៃខែឆ្នាំកំណើត (DD/MM/YYYY) *</label>
              <input
                type="text"
                className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                placeholder="01/01/2000"
                maxLength={10}
                {...register('dateOfBirth', { required: 'ត្រូវបំពេញថ្ងៃខែឆ្នាំកំណើត' })}
                onKeyUp={handleDateFormat}
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.message}</p>}
            </div>

            {/* ភេទ */}
            <div className="md:col-span-1">
              <label className="label">ភេទ *</label>
              <select
                className={`input ${errors.gender ? 'border-red-500' : ''}`}
                {...register('gender', { required: 'ត្រូវជ្រើសរើសភេទ' })}
              >
                <option value="">ជ្រើសរើសភេទ</option>
                <option value="Male">ប្រុស</option>
                <option value="Female">ស្រី</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>}
            </div>

            {/* ទូរស័ព្ទ */}
            <div className="md:col-span-2">
              <label className="label">ទូរស័ព្ទ *</label>
              <input
                type="tel"
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+855 12 345 678"
                maxLength={16}
                {...register('phone', { required: 'ត្រូវបំពេញលេខទូរស័ព្ទ' })}
                onChange={(e) => handlePhoneFormat(e, 'phone')}
                onFocus={(e) => { if (!e.target.value) setValue('phone', '+855 '); }}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            {/* អ៊ីមែល */}
            <div className="md:col-span-3">
              <label className="label">អ៊ីមែល</label>
              <input
                type="email"
                className={`input ${isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="username@gmail.com"
                readOnly={isEditMode}
                {...register('email')}
                onChange={(e) => {
                  if (!isEditMode) {
                    e.target.value = e.target.value.toLowerCase();
                    setValue('email', e.target.value);
                  }
                }}
                onBlur={isEditMode ? undefined : handleEmailBlur}
              />
              {isEditMode && <p className="mt-1 text-xs text-gray-400">មិនអាចផ្លាស់ប្ដូរអ៊ីមែលបានទេ</p>}
            </div>

            {/* Password (create only) */}
            {!isEditMode && (
              <div className="md:col-span-3">
                <label className="label">លេខសម្ងាត់ *</label>
                <input
                  type="text"
                  className={`input ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="auto-generated"
                  {...register('password', {
                    required: 'ត្រូវបំពេញលេខសម្ងាត់',
                    minLength: { value: 6, message: 'យ៉ាងហោចណាស់ 6 តួ' },
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">បង្កើតដោយស្វ័យប្រវត្តិ: latinname@last3digits</p>
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Academic Info ─────────────────────────────────────── */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ព័ត៌មានសិក្សា</h3>
          <div className="space-y-6">

            {/* ជំនាញ & ជំនាន់ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">ជំនាញឯកទេស *</label>
                <select
                  className={`input ${errors.department ? 'border-red-500' : ''}`}
                  {...register('department', { required: 'ត្រូវជ្រើសរើសជំនាញឯកទេស' })}
                >
                  <option value="">ជ្រើសរើសជំនាញឯកទេស</option>
                  {departmentsData?.map((dept) => (
                    <option key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department.message}</p>}
                <input type="hidden" {...register('course')} />
              </div>

              <div>
                <label className="label">ជំនាន់ (Generation) *</label>
                <input
                  type="text"
                  className={`input ${errors.generation ? 'border-red-500' : ''}`}
                  placeholder="ខ. ជំនាន់ទី១"
                  {...register('generation', { required: 'ត្រូវបំពេញជំនាន់សិក្សា' })}
                />
                {errors.generation && <p className="mt-1 text-sm text-red-500">{errors.generation.message}</p>}
              </div>
            </div>

            {/* ការបញ្ចុះតម្លៃ & ឆ្នាំសិក្សា */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">ការបញ្ចុះតម្លៃ *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`input w-32 ${errors.feeDiscount ? 'border-red-500' : ''}`}
                    placeholder="0"
                    {...register('feeDiscount', {
                      required: 'ត្រូវបំពេញការបញ្ចុះតម្លៃ',
                      min: { value: 0, message: 'ត្រូវតែ 0% ឬក្រោយជាង' },
                      max: { value: 100, message: 'ត្រូវតែ 100% ឬតូចជាង' },
                    })}
                  />
                  <span className="text-gray-700 font-medium">%</span>
                </div>
                {errors.feeDiscount && <p className="mt-1 text-sm text-red-500">{errors.feeDiscount.message}</p>}
              </div>

              <div>
                <label className="label">ក្នុងឆ្នាំសិក្សា *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="input w-24 text-center"
                    placeholder="2024"
                    maxLength={4}
                    {...register('academicYearStart', { required: 'ត្រូវបំពេញឆ្នាំសិក្សា' })}
                    onChange={(e) => {
                      const y = e.target.value;
                      if (y.length === 4 && /^\d{4}$/.test(y)) {
                        const end = parseInt(y) + 1;
                        setValue('academicYearEnd', String(end));
                        setValue('academicYear', `${y}-${end}`);
                      }
                    }}
                  />
                  <span className="text-gray-500 font-medium">-</span>
                  <input
                    type="text"
                    className="input w-24 text-center"
                    placeholder="2025"
                    maxLength={4}
                    {...register('academicYearEnd', { required: 'ត្រូវបំពេញឆ្នាំសិក្សា' })}
                  />
                </div>
                <input type="hidden" {...register('academicYear')} />
              </div>
            </div>

            {/* វគ្គ & ឆមាស */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">វគ្គទី *</label>
                <input
                  type="text"
                  className={`input ${errors.batch ? 'border-red-500' : ''}`}
                  placeholder="ខ. វគ្គទី១"
                  {...register('batch', { required: 'ត្រូវបំពេញវគ្គ' })}
                />
                {errors.batch && <p className="mt-1 text-sm text-red-500">{errors.batch.message}</p>}
              </div>

              <div>
                <label className="label">ឆមាសទី *</label>
                <select
                  className={`input ${errors.semester ? 'border-red-500' : ''}`}
                  {...register('semester', { required: 'ត្រូវជ្រើសរើសឆមាស' })}
                >
                  <option value="">ជ្រើសរើសឆមាស</option>
                  <option value="1st">ឆមាសទី១</option>
                  <option value="2nd">ឆមាសទី២</option>
                </select>
                {errors.semester && <p className="mt-1 text-sm text-red-500">{errors.semester.message}</p>}
              </div>
            </div>

            {/* ឆ្នាំ & កម្រិតសិក្សា */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">ឆ្នាំទី *</label>
                <select
                  className={`input ${errors.class ? 'border-red-500' : ''}`}
                  {...register('class', { required: 'ត្រូវជ្រើសរើសឆ្នាំសិក្សា' })}
                >
                  <option value="">ជ្រើសរើសឆ្នាំសិក្សា</option>
                  <option value="1">ឆ្នាំទី១</option>
                  <option value="2">ឆ្នាំទី២</option>
                  <option value="3">ឆ្នាំទី៣</option>
                  <option value="4">ឆ្នាំទី៤</option>
                  <option value="5">ឆ្នាំទី៥</option>
                </select>
                {errors.class && <p className="mt-1 text-sm text-red-500">{errors.class.message}</p>}
              </div>

              <div>
                <label className="label">កម្រិតសិក្សា *</label>
                <select
                  className={`input ${errors.studyLevel ? 'border-red-500' : ''}`}
                  {...register('studyLevel', { required: 'ត្រូវជ្រើសរើសកម្រិតសិក្សា' })}
                >
                  <option value="">ជ្រើសរើសកម្រិតសិក្សា</option>
                  <option value="Bachelor">បរិញ្ញាបត្រ</option>
                  <option value="Associate">អនុបណ្ឌិត</option>
                  <option value="Diploma">ឌីប្លូម</option>
                  <option value="Certificate">វិញ្ញាបនប័ត្រ</option>
                </select>
                {errors.studyLevel && <p className="mt-1 text-sm text-red-500">{errors.studyLevel.message}</p>}
              </div>
            </div>

            {/* វេនសិក្សា */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">វេនសិក្សា *</label>
                <select className="input" {...register('studyShift')}>
                  <option value="morning">ព្រឹក</option>
                  <option value="afternoon">រសៀល</option>
                  <option value="evening">យប់</option>
                  <option value="weekend">សៅរ៍-អាទិត្យ</option>
                </select>
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            បោះបង់
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending
              ? 'កំពុងរក្សាទុក...'
              : isEditMode
              ? 'រក្សាទុកការផ្លាស់ប្ដូរ'
              : 'រក្សាទុក'}
          </button>
        </div>
      </form>
    </div>
  );
}
