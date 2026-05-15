import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function StudentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paymentType: 'cash',
      studyShift: 'morning',
      isFirstGeneration: 'no',
    },
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const phone = watch('phone');
  const selectedDepartment = watch('department');

  // Fetch total students count for auto-generating student ID
  const { data: studentsCount } = useQuery({
    queryKey: ['studentsCount'],
    queryFn: async () => {
      const response = await api.get('/students?limit=1&page=1&includeAll=true');
      return response.data.pagination?.total || 0;
    },
  });

  // Fetch departments
  const { data: departmentsData, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await api.get('/departments/list');
      return response.data.data;
    },
  });

  // Fetch courses
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/courses/list');
      return response.data.data;
    },
  });

  // Filter courses based on selected department
  const filteredCourses = selectedDepartment
    ? coursesData?.filter(
      (course) =>
        course.departmentId === selectedDepartment ||
        course.departmentId === parseInt(selectedDepartment)
    ) || []
    : [];

  // Auto-sync course with department name
  useEffect(() => {
    if (selectedDepartment && departmentsData) {
      const dept = departmentsData.find(d => String(d.id) === String(selectedDepartment));
      if (dept) {
        setValue('course', dept.name, { shouldValidate: true });
      }
    }
  }, [selectedDepartment, departmentsData, setValue]);

  // Auto-generate student ID when component mounts
  useEffect(() => {
    if (studentsCount !== undefined) {
      const newStudentId = `STU${String(studentsCount + 1).padStart(6, '0')}`;
      setValue('studentId', newStudentId);
    }
  }, [studentsCount, setValue]);

  // Auto-generate password based on firstName, lastName, @, and last 3 digits of phone
  useEffect(() => {
    if (firstName && lastName && phone && phone.length >= 3) {
      const firstNameLower = firstName.toLowerCase().replace(/\\s+/g, '');
      const lastNameLower = lastName.toLowerCase().replace(/\\s+/g, '');
      const last3Phone = phone.slice(-3);
      const generatedPassword = `${firstNameLower}.${lastNameLower}@${last3Phone}`;
      setValue('password', generatedPassword);
    }
  }, [firstName, lastName, phone, setValue]);

  // Handle email blur to auto-add @gmail.com
  const handleEmailBlur = (e) => {
    const value = e.target.value;
    if (value && !value.includes('@')) {
      setValue('email', `${value}@gmail.com`);
    }
  };

  // Auto-capitalize first letter of each word
  const handleCapitalize = (e, fieldName) => {
    const value = e.target.value;
    const capitalized = value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setValue(fieldName, capitalized);
  };

  // Format phone number: +855 XX XXX XXX
  const handlePhoneFormat = (e, fieldName) => {
    let value = e.target.value;

    if (!value || value.length === 0) {
      setValue(fieldName, '+855 ');
      return;
    }

    let cleaned = value.replace(/\\s/g, '');

    if (!cleaned.startsWith('+855')) {
      cleaned = '+855' + cleaned.replace(/^\\+?\\d{0,3}/, '');
    }

    const prefix = '+855';
    const digits = cleaned.slice(4);

    if (digits.length === 0) {
      setValue(fieldName, prefix + ' ');
      return;
    }

    let formatted = prefix + ' ';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5) {
        formatted += ' ';
      }
      formatted += digits[i];
    }

    setValue(fieldName, formatted);
  };

  // Format date: DD/MM/YYYY
  const handleDateFormat = (e) => {
    let value = e.target.value.replace(/\\D/g, '');
    let formatted = '';

    if (value.length >= 1) {
      let day = value.slice(0, 2);
      if (value.length === 1 && parseInt(value) > 3) {
        day = '0' + value;
        value = day + value.slice(1);
      }
      formatted = day;
    }
    if (value.length >= 3) {
      let month = value.slice(2, 4);
      if (value.length === 3 && parseInt(value.slice(2, 3)) > 1) {
        month = '0' + value.slice(2, 3);
        value = value.slice(0, 2) + month + value.slice(3);
      }
      formatted = formatted.slice(0, 2) + '/' + month;
    }
    if (value.length >= 5) {
      formatted = formatted.slice(0, 5) + '/' + value.slice(4, 8);
    }

    e.target.value = formatted;
  };

  // Convert number to Khmer words (simple implementation)
  const numberToKhmerWords = (num) => {
    if (!num) return '';
    const ones = ['', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន'];
    const tens = ['', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប', 'ហាសិប', 'ហុកសិប', 'ចិតសិប', 'ប៉ែតសិប', 'កៅសិប'];

    // Simple conversion for numbers up to 999,999
    const amount = parseInt(num);
    if (isNaN(amount)) return '';

    return `${amount.toLocaleString()} ដុល្លារ`; // Simplified
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      return api.post('/students', data);
    },
    onSuccess: () => {
      toast.success('បានបន្ថែមនិស្សិតដោយជោគជ័យ');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/admin/students');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'មានបញ្ហាក្នុងការបន្ថែម');
    },
  });

  const onSubmit = (data) => {
    // Convert dateOfBirth from DD/MM/YYYY to YYYY-MM-DD
    if (data.dateOfBirth) {
      const parts = data.dateOfBirth.split('/');
      if (parts.length === 3) {
        data.dateOfBirth = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Convert paymentDate from DD/MM/YYYY to YYYY-MM-DD
    if (data.paymentDate) {
      const parts = data.paymentDate.split('/');
      if (parts.length === 3) {
        data.paymentDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    mutation.mutate(data);
  };

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
            បញ្ចូលនិស្សិតថ្មី
          </h1>
          <p className="text-gray-600">សូមបំពេញព័ត៌មានលម្អិតខាងក្រោម</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ព័ត៌មានផ្ទាល់ខ្លួន - Personal Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ពត៌មានផ្ទាល់ខ្លួននិស្សិត
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: ឈ្មោះ & អក្សរឡាតាំង */}
            <div>
              <label className="label">ឈ្មោះ (ជាភាសាខ្មែរ) *</label>
              <input
                type="text"
                autoFocus
                className={`input ${errors.khmerName ? 'border-red-500' : ''}`}
                placeholder="បំពេញឈ្មោះជាភាសាខ្មែរ"
                {...register('khmerName', {
                  required: 'ត្រូវបំពេញឈ្មោះជាភាសាខ្មែរ',
                })}
              />
              {errors.khmerName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.khmerName.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">អក្សរឡាតាំង (Latin Name) *</label>
              <input
                type="text"
                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="First Name"
                {...register('firstName', {
                  required: 'Required',
                })}
                onChange={(e) => handleCapitalize(e, 'firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">នាមត្រកូល (Last Name) *</label>
              <input
                type="text"
                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Last Name"
                {...register('lastName', { required: 'Required' })}
                onChange={(e) => handleCapitalize(e, 'lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Row 2: ថ្ងៃខែឆ្នាំកំណើត & ភេទ */}
            <div>
              <label className="label">ថ្ងៃខែឆ្នាំកំណើត (DD/MM/YYYY) *</label>
              <input
                type="text"
                className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                placeholder="01/01/2000"
                maxLength={10}
                {...register('dateOfBirth', {
                  required: 'ត្រូវបំពេញថ្ងៃខែឆ្នាំកំណើត',
                })}
                onKeyUp={handleDateFormat}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">ភេទ (Gender) *</label>
              <select
                className={`input ${errors.gender ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('gender', { required: 'ត្រូវជ្រើសរើសភេទ' })}
              >
                <option value="" disabled>
                  ជ្រើសរើសភេទ
                </option>
                <option value="Male">ប្រុស (Male)</option>
                <option value="Female">ស្រី (Female)</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* Row 3: Phone */}
            <div>
              <label className="label">ទូរស័ព្ទ (Phone) *</label>
              <input
                type="tel"
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+855 12 345 678"
                maxLength={16}
                {...register('phone', {
                  required: 'ត្រូវបំពេញលេខទូរស័ព្ទ',
                })}
                onChange={(e) => handlePhoneFormat(e, 'phone')}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setValue('phone', '+855 ');
                  }
                }}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>



            {/* Row 4: Email (Optional) */}
            <div className="md:col-span-2">
              <label className="label">អ៊ីមែល (Email)</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="username (auto @gmail.com)"
                {...register('email')}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase();
                  setValue('email', e.target.value);
                }}
                onBlur={handleEmailBlur}
              />
              <p className="mt-1 text-xs text-gray-500">
                វាយឈ្មោះអ្នកប្រើប្រាស់ហើយនឹងបន្ថែម @gmail.com ស្វ័យប្រវត្តិ (ស្រេចចិត្ត)
              </p>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>


          </div>
        </div>

        {/* ព័ត៌មានសិក្សា - Academic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ព័ត៌មានសិក្សា
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: ជំនាញឯកទេស & និស្សិតជំនាន់ទី១ */}
            <div>
              <label className="label">ជំនាញឯកទេស (Specialization) *</label>
              <select
                className={`input ${errors.department ? 'border-red-500' : ''}`}
                defaultValue=""
                disabled={loadingDepartments}
                {...register('department', {
                  required: 'ត្រូវជ្រើសរើសជំនាញឯកទេស',
                })}
              >
                <option value="" disabled>
                  {loadingDepartments
                    ? 'កំពុងផ្ទុក...'
                    : 'ជ្រើសរើសជំនាញឯកទេស'}
                </option>
                {departmentsData?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.department.message}
                </p>
              )}
              <input type="hidden" {...register('course')} />
            </div>

            <div>
              <label className="label">ជំនាន់ (Generation) *</label>
              <input
                type="text"
                className={`input ${errors.generation ? 'border-red-500' : ''}`}
                placeholder="ឧ. ជំនាន់ទី១, ជំនាន់ទី២"
                {...register('generation', {
                  required: 'ត្រូវបំពេញជំនាន់សិក្សា',
                })}
              />
              {errors.generation && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.generation.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">ការបញ្ចុះតម្លៃ (Fees Discount) *</label>
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
              {errors.feeDiscount && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.feeDiscount.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                បញ្ចូលភាគរយបញ្ចុះតម្លៃ (0-100%)
              </p>
            </div>

            <div>
              <label className="label">ក្នុងឆ្នាំសិក្សា (Academic Year) *</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="input w-24 text-center"
                  placeholder="2024"
                  maxLength={4}
                  {...register('academicYearStart', {
                    required: 'Required',
                  })}
                  onChange={(e) => {
                    const startYear = e.target.value;
                    if (startYear.length === 4 && /^\d{4}$/.test(startYear)) {
                      const endYear = parseInt(startYear) + 1;
                      setValue('academicYearEnd', String(endYear));
                      setValue('academicYear', `${startYear}-${endYear}`);
                    }
                  }}
                />
                <span className="text-gray-500 font-medium">-</span>
                <input
                  type="text"
                  className="input w-24 text-center"
                  placeholder="2025"
                  maxLength={4}
                  {...register('academicYearEnd', {
                    required: 'Required',
                  })}
                />
              </div>
              <input type="hidden" {...register('academicYear')} />
            </div>

            {/* Row 2: វគ្គទី, ឆមាសទី, ឆ្នាំទី */}
            <div>
              <label className="label">វគ្គទី (Batch) *</label>
              <input
                type="text"
                className={`input ${errors.batch ? 'border-red-500' : ''}`}
                placeholder="ឧ. វគ្គទី១, វគ្គទី២"
                {...register('batch', {
                  required: 'ត្រូវបំពេញវគ្គ',
                })}
              />
              {errors.batch && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.batch.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">ឆមាសទី (Semester) *</label>
              <select
                className={`input ${errors.semester ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('semester', { required: 'ត្រូវជ្រើសរើសឆមាស' })}
              >
                <option value="" disabled>
                  ជ្រើសរើសឆមាស
                </option>
                <option value="1st">ឆមាសទី១ (1st Semester)</option>
                <option value="2nd">ឆមាសទី២ (2nd Semester)</option>
              </select>
              {errors.semester && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.semester.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">ឆ្នាំទី (Year Level) *</label>
              <select
                className={`input ${errors.class ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('class', { required: 'ត្រូវជ្រើសរើសឆ្នាំសិក្សា' })}
              >
                <option value="" disabled>
                  ជ្រើសរើសឆ្នាំសិក្សា
                </option>
                <option value="1">ឆ្នាំទី១ (Year 1)</option>
                <option value="2">ឆ្នាំទី២ (Year 2)</option>
                <option value="3">ឆ្នាំទី៣ (Year 3)</option>
                <option value="4">ឆ្នាំទី៤ (Year 4)</option>
                <option value="5">ឆ្នាំទី៥ (Year 5)</option>
              </select>
              {errors.class && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.class.message}
                </p>
              )}
            </div>



            {/* Row 4: កម្រិតសិក្សា & វេនសិក្សា */}
            <div>
              <label className="label">កម្រិតសិក្សា (Education Level) *</label>
              <select
                className={`input ${errors.studyLevel ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('studyLevel', {
                  required: 'ត្រូវជ្រើសរើសកម្រិតសិក្សា',
                })}
              >
                <option value="" disabled>
                  ជ្រើសរើសកម្រិតសិក្សា
                </option>
                <option value="Bachelor">បរិញ្ញាបត្រ (Bachelor)</option>
                <option value="Associate">អនុបណ្ឌិត (Associate)</option>
                <option value="Diploma">ឌីប្លូម (Diploma)</option>
                <option value="Certificate">វិញ្ញាបនប័ត្រ (Certificate)</option>
              </select>
              {errors.studyLevel && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.studyLevel.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">វេនសិក្សា (Study Shift) *</label>
              <select
                className="input"
                defaultValue="morning"
                {...register('studyShift')}
              >
                <option value="morning">ព្រឹក (Morning)</option>
                <option value="afternoon">រសៀល (Afternoon)</option>
                <option value="evening">យប់ (Evening)</option>
                <option value="weekend">សៅរ៍-អាទិត្យ (Weekend)</option>
              </select>
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
            បោះបង់ (Cancel)
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក (Save)'}
          </button>
        </div>
      </form >
    </div >
  );
}
