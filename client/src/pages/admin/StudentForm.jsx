import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const phone = watch('phone');
  const selectedDepartment = watch('department');

  // Fetch total students count for auto-generating student ID (include all students, even deleted ones)
  const { data: studentsCount } = useQuery({
    queryKey: ['studentsCount'],
    queryFn: async () => {
      const response = await api.get(
        '/students?limit=1&page=1&includeAll=true'
      );
      return response.data.pagination?.total || 0;
    },
    enabled: !isEdit,
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
        (course) => course.departmentId === selectedDepartment || 
                    course.departmentId === parseInt(selectedDepartment)
      ) || []
    : [];

  // Auto-generate student ID when component mounts (for new students)
  useEffect(() => {
    if (!isEdit && studentsCount !== undefined) {
      const newStudentId = `STU${String(studentsCount + 1).padStart(6, '0')}`;
      setValue('studentId', newStudentId);
    }
  }, [studentsCount, isEdit, setValue]);

  // Auto-generate password based on firstName, lastName, @, and last 3 digits of phone
  useEffect(() => {
    if (!isEdit && firstName && lastName && phone && phone.length >= 3) {
      const firstNameLower = firstName.toLowerCase().replace(/\\s+/g, '');
      const lastNameLower = lastName.toLowerCase().replace(/\\s+/g, '');
      const last3Phone = phone.slice(-3);
      const generatedPassword = `${firstNameLower}.${lastNameLower}@${last3Phone}`;
      setValue('password', generatedPassword);
    }
  }, [firstName, lastName, phone, isEdit, setValue]);

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
    
    // If empty or just starting to type, set default prefix
    if (!value || value.length === 0) {
      setValue(fieldName, '+855 ');
      return;
    }
    
    // Remove all spaces
    let cleaned = value.replace(/\s/g, '');
    
    // Ensure it starts with +855
    if (!cleaned.startsWith('+855')) {
      cleaned = '+855' + cleaned.replace(/^\+?\d{0,3}/, '');
    }
    
    // Format: +855 XX XXX XXX
    const prefix = '+855';
    const digits = cleaned.slice(4); // Get digits after +855
    
    if (digits.length === 0) {
      setValue(fieldName, prefix + ' ');
      return;
    }
    
    // Format as: XX XXX XXX (2 digits, space, 3 digits, space, 3 digits)
    let formatted = prefix + ' ';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    
    setValue(fieldName, formatted);
  };

  // Format date of birth: auto-pad single digits and add slashes
  const handleDOBFormat = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = '';

    if (value.length >= 1) {
      // Day part
      let day = value.slice(0, 2);
      if (value.length === 1 && parseInt(value) > 3) {
        day = '0' + value;
        value = day + value.slice(1);
      }
      formatted = day;
    }
    if (value.length >= 3) {
      // Month part
      let month = value.slice(2, 4);
      if (value.length === 3 && parseInt(value.slice(2, 3)) > 1) {
        month = '0' + value.slice(2, 3);
        value = value.slice(0, 2) + month + value.slice(3);
      }
      formatted = formatted.slice(0, 2) + '/' + month;
    }
    if (value.length >= 5) {
      // Year part
      formatted = formatted.slice(0, 5) + '/' + value.slice(4, 8);
    }

    e.target.value = formatted;
  };

  // Fetch student data if editing
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const response = await api.get(`/students/${id}`);
      return response.data.data;
    },
    enabled: isEdit,
  });

  // Helper function to format phone for display
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    // Remove all spaces and non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Remove + if present
    cleaned = cleaned.replace(/\+/g, '');
    // Get only digits after country code
    let digits = cleaned.startsWith('855') ? cleaned.slice(3) : cleaned;
    // Ensure we have the right number of digits
    if (digits.length < 8) return phone; // Return as-is if invalid
    // Format as +855 XX XXX XXX
    const formatted = `+855 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
    return formatted;
  };

  // Set form values when student data is loaded
  useEffect(() => {
    if (student) {
      const academicYearParts = student.academicYear?.split('-') || [];
      // Convert dateOfBirth from YYYY-MM-DD to DD/MM/YYYY format
      let formattedDOB = '';
      if (student.dateOfBirth) {
        const dobParts = student.dateOfBirth.split('T')[0].split('-');
        if (dobParts.length === 3) {
          formattedDOB = `${dobParts[2]}/${dobParts[1]}/${dobParts[0]}`;
        }
      }
      reset({
        studentId: student.studentId,
        firstName: student.user?.firstName || student.firstName,
        lastName: student.user?.lastName || student.lastName,
        gender: student.gender,
        dateOfBirth: formattedDOB,
        nationality: student.nationality,
        religion: student.religion,
        job: student.job,
        email: student.user?.email || student.email,
        phone: formatPhoneForDisplay(student.user?.phone || student.phone),
        nationalId: student.nationalId,
        address: student.address,
        studyLevel: student.studyLevel,
        class: student.class,
        semester: student.semester,
        department: student.department,
        course: student.course,
        academicYear: student.academicYear,
        academicYearStart: academicYearParts[0] || '',
        academicYearEnd: academicYearParts[1] || '',
        enrollmentDate: student.enrollmentDate?.split('T')[0],
        feeType: student.feeType,
        studyTime: student.studyTime,
        distanceFromSchool: student.distanceFromSchool,
        transportation: student.transportation,
        guardianName: student.guardianName,
        guardianEmail: student.guardianEmail,
        guardianPhone: formatPhoneForDisplay(student.guardianPhone),
        guardianRelation: student.guardianRelation,
      });
    }
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return api.put(`/students/${id}`, data);
      }
      return api.post('/students', data);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? 'Student updated successfully' : 'Student created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate('/admin/students');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });

  const onSubmit = (data) => {
    // Clean up empty values to avoid foreign key constraint issues
    const cleanedData = { ...data };
    // Convert dateOfBirth from DD/MM/YYYY to YYYY-MM-DD format for backend
    if (cleanedData.dateOfBirth) {
      const parts = cleanedData.dateOfBirth.split('/');
      if (parts.length === 3) {
        cleanedData.dateOfBirth = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    mutation.mutate(cleanedData);
  };

  if (isEdit && loadingStudent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? 'Update student information'
              : 'Enter the student details below'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: Student ID & National ID */}
            <div>
              <label className="label">Student ID *</label>
              <input
                type="text"
                autoFocus
                className={`input ${errors.studentId ? 'border-red-500' : ''}`}
                placeholder="Auto-generated"
                {...register('studentId', {
                  required: 'Student ID is required',
                })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-generated based on total students
              </p>
              {errors.studentId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.studentId.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">National ID</label>
              <input
                type="text"
                className="input"
                placeholder="Enter National ID number"
                {...register('nationalId')}
              />
            </div>

            {/* Row 2: First Name & Last Name */}
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                {...register('firstName', {
                  required: 'First name is required',
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
              <label className="label">Last Name *</label>
              <input
                type="text"
                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                {...register('lastName', { required: 'Last name is required' })}
                onChange={(e) => handleCapitalize(e, 'lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Row 3: Gender & Date of Birth */}
            <div>
              <label className="label">Gender *</label>
              <select
                className={`input ${errors.gender ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('gender', { required: 'Gender is required' })}
              >
                <option value="" disabled>
                  Select Gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.gender.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Date of Birth * (DD/MM/YYYY)</label>
              <input
                type="text"
                className={`input ${
                  errors.dateOfBirth ? 'border-red-500' : ''
                }`}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                {...register('dateOfBirth', {
                  required: 'Date of birth is required',
                  pattern: {
                    value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                    message: 'Invalid format. Use DD/MM/YYYY',
                  },
                  validate: (value) => {
                    if (!value) return true;
                    const parts = value.split('/');
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    const date = new Date(year, month - 1, day);
                    if (
                      date.getDate() !== day ||
                      date.getMonth() !== month - 1 ||
                      date.getFullYear() !== year
                    ) {
                      return 'Invalid date';
                    }
                    if (date > new Date()) {
                      return 'Date cannot be in the future';
                    }
                    return true;
                  },
                })}
                onKeyUp={handleDOBFormat}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* Row 4: Nationality & Religion */}
            <div>
              <label className="label">Nationality *</label>
              <input
                type="text"
                className={`input ${
                  errors.nationality ? 'border-red-500' : ''
                }`}
                placeholder="Enter nationality"
                {...register('nationality', {
                  required: 'Nationality is required',
                })}
                onChange={(e) => handleCapitalize(e, 'nationality')}
              />
              {errors.nationality && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.nationality.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Religion</label>
              <select
                className="input"
                defaultValue=""
                {...register('religion')}
              >
                <option value="" disabled>
                  Select Religion
                </option>
                <option value="Buddhism">Buddhism</option>
                <option value="Islam">Islam</option>
                <option value="Christianity">Christianity</option>
                <option value="Hinduism">Hinduism</option>
                <option value="None">None</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Row 5: Job & City/Province */}
            <div>
              <label className="label">Job/Occupation</label>
              <input
                type="text"
                className="input"
                placeholder="Current job or occupation"
                {...register('job')}
                onChange={(e) => handleCapitalize(e, 'job')}
              />
            </div>
            <div>
              <label className="label">City/Province *</label>
              <select
                className={`input ${errors.address ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('address', {
                  required: 'City/Province is required',
                })}
              >
                <option value="" disabled>
                  Select City/Province
                </option>
                <option value="Phnom Penh">Phnom Penh</option>
                <option value="Siem Reap">Siem Reap</option>
                <option value="Battambang">Battambang</option>
                <option value="Sihanoukville">Sihanoukville</option>
                <option value="Kampong Cham">Kampong Cham</option>
                <option value="Kampong Thom">Kampong Thom</option>
                <option value="Kampong Speu">Kampong Speu</option>
                <option value="Kampong Chhnang">Kampong Chhnang</option>
                <option value="Kandal">Kandal</option>
                <option value="Prey Veng">Prey Veng</option>
                <option value="Svay Rieng">Svay Rieng</option>
                <option value="Takeo">Takeo</option>
                <option value="Banteay Meanchey">Banteay Meanchey</option>
                <option value="Pursat">Pursat</option>
                <option value="Koh Kong">Koh Kong</option>
                <option value="Kratie">Kratie</option>
                <option value="Stung Treng">Stung Treng</option>
                <option value="Ratanakiri">Ratanakiri</option>
                <option value="Mondulkiri">Mondulkiri</option>
                <option value="Preah Vihear">Preah Vihear</option>
                <option value="Oddar Meanchey">Oddar Meanchey</option>
                <option value="Pailin">Pailin</option>
                <option value="Kep">Kep</option>
                <option value="Tbong Khmum">Tbong Khmum</option>
              </select>
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Row 6: Email & Phone */}
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email (auto-adds @gmail.com)"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase();
                  setValue('email', e.target.value);
                }}
                onBlur={handleEmailBlur}
              />
              <p className="mt-1 text-xs text-gray-500">
                Type username and @gmail.com will be added automatically
              </p>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="+855 12 345 678"
                maxLength={16}
                {...register('phone')}
                onChange={(e) => handlePhoneFormat(e, 'phone')}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setValue('phone', '+855 ');
                  }
                }}
              />
            </div>

            {/* Row 7: Password (only for new students) */}
            {!isEdit && (
              <div className="md:col-span-2">
                <label className="label">Password *</label>
                <input
                  type="text"
                  className={`input ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Auto-generated: firstname.lastname@XXX"
                  {...register('password', {
                    required: !isEdit ? 'Password is required' : false,
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto-generated from firstname.lastname@last3digits of phone
                </p>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Academic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Study Level *</label>
              <select
                className={`input ${errors.studyLevel ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('studyLevel', {
                  required: 'Study level is required',
                })}
              >
                <option value="" disabled>
                  Select Study Level
                </option>
                <option value="Bachelor of Technology/Specialization">
                  Bachelor of Technology/Specialization
                </option>
                <option value="Higher Technical Diploma">
                  Higher Technical Diploma
                </option>
                <option value="Technical and Vocational Diploma 3">
                  Technical and Vocational Diploma 3
                </option>
                <option value="Technical and Vocational Diploma 2">
                  Technical and Vocational Diploma 2
                </option>
                <option value="Technical and Vocational Diploma 1">
                  Technical and Vocational Diploma 1
                </option>
                <option value="Vocational Certificate">
                  Vocational Certificate
                </option>
              </select>
              {errors.studyLevel && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.studyLevel.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Year Level *</label>
              <select
                className={`input ${errors.class ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('class', { required: 'Year level is required' })}
              >
                <option value="" disabled>
                  Select Year Level
                </option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
              {errors.class && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.class.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Semester *</label>
              <select
                className={`input ${errors.semester ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('semester', { required: 'Semester is required' })}
              >
                <option value="" disabled>
                  Select Semester
                </option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
              </select>
              {errors.semester && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.semester.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Department *</label>
              <select
                className={`input ${errors.department ? 'border-red-500' : ''}`}
                defaultValue=""
                disabled={loadingDepartments}
                {...register('department', {
                  required: 'Department is required',
                })}
              >
                <option value="" disabled>
                  {loadingDepartments ? 'Loading departments...' : 'Select Department'}
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
            </div>
            <div>
              <label className="label">Course/Major</label>
              <select 
                className="input" 
                defaultValue=""
                {...register('course')}
                disabled={!selectedDepartment || loadingCourses}
              >
                <option value="" disabled>
                  {!selectedDepartment 
                    ? 'Select department first' 
                    : loadingCourses 
                    ? 'Loading courses...' 
                    : filteredCourses.length === 0 
                    ? 'No courses available' 
                    : 'Select Course'}
                </option>
                {filteredCourses?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {selectedDepartment && filteredCourses.length > 0 
                  ? `${filteredCourses.length} course(s) available` 
                  : 'Select department first to see available courses'}
              </p>
            </div>
            <div>
              <label className="label">Academic Year *</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className={`input w-24 text-center ${
                    errors.academicYear ? 'border-red-500' : ''
                  }`}
                  placeholder="2024"
                  maxLength={4}
                  {...register('academicYearStart', {
                    required: 'Start year is required',
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Enter 4-digit year',
                    },
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
                  className={`input w-24 text-center ${
                    errors.academicYear ? 'border-red-500' : ''
                  }`}
                  placeholder="2025"
                  maxLength={4}
                  {...register('academicYearEnd', {
                    required: 'End year is required',
                    pattern: {
                      value: /^\d{4}$/,
                      message: 'Enter 4-digit year',
                    },
                  })}
                  onChange={(e) => {
                    const endYear = e.target.value;
                    const startYear = watch('academicYearStart');
                    if (startYear && endYear.length === 4) {
                      setValue('academicYear', `${startYear}-${endYear}`);
                    }
                  }}
                />
              </div>
              <input type="hidden" {...register('academicYear')} />
              {(errors.academicYearStart || errors.academicYearEnd) && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.academicYearStart?.message ||
                    errors.academicYearEnd?.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Enrollment Date</label>
              <input
                type="date"
                className={`input ${
                  errors.enrollmentDate ? 'border-red-500' : ''
                }`}
                {...register('enrollmentDate', {
                  validate: (value) => {
                    if (!value) return true;
                    const startYear = watch('academicYearStart');
                    if (startYear) {
                      const enrollmentYear = new Date(value).getFullYear();
                      if (enrollmentYear < parseInt(startYear)) {
                        return `Enrollment date must be in ${startYear} or later`;
                      }
                    }
                    return true;
                  },
                })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be same or after academic year start
              </p>
              {errors.enrollmentDate && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.enrollmentDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Fee Type *</label>
              <select
                className={`input ${errors.feeType ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('feeType', { required: 'Fee type is required' })}
              >
                <option value="" disabled>
                  Select Fee Type
                </option>
                <option value="Scholarship">Scholarship</option>
                <option value="Paid">Paid</option>
              </select>
              {errors.feeType && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.feeType.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Study Time *</label>
              <select
                className={`input ${errors.studyTime ? 'border-red-500' : ''}`}
                defaultValue=""
                {...register('studyTime', {
                  required: 'Study time is required',
                })}
              >
                <option value="" disabled>
                  Select Study Time
                </option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Saturday-Sunday">Saturday-Sunday</option>
              </select>
              {errors.studyTime && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.studyTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Distance from School</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input pr-12"
                  placeholder="e.g., 5.5"
                  {...register('distanceFromSchool')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  KM
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Distance from school to current residence
              </p>
            </div>
            <div>
              <label className="label">Transportation</label>
              <select
                className="input"
                defaultValue=""
                {...register('transportation')}
              >
                <option value="" disabled>
                  Select Transportation
                </option>
                <option value="Own motorbike">Own motorbike</option>
                <option value="Provided by school (Free)">
                  Provided by school (Free)
                </option>
                <option value="Provided by community (Free)">
                  Provided by community (Free)
                </option>
                <option value="Public transportation (Own expense)">
                  Public transportation (Own expense)
                </option>
                <option value="Walking">Walking</option>
                <option value="By bike">By bike</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Guardian Name</label>
              <input
                type="text"
                className="input"
                placeholder="Full name of guardian"
                {...register('guardianName')}
                onChange={(e) => handleCapitalize(e, 'guardianName')}
              />
            </div>
            <div>
              <label className="label">Relationship</label>
              <select
                className="input"
                defaultValue=""
                {...register('guardianRelation')}
              >
                <option value="" disabled>
                  Select Relationship
                </option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Guardian Email</label>
              <input
                type="email"
                className="input"
                placeholder="guardian@email.com"
                {...register('guardianEmail')}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase();
                  setValue('guardianEmail', e.target.value);
                }}
              />
            </div>
            <div>
              <label className="label">Guardian Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="+855 12 345 678"
                maxLength={16}
                {...register('guardianPhone')}
                onChange={(e) => handlePhoneFormat(e, 'guardianPhone')}
                onFocus={(e) => {
                  if (!e.target.value) {
                    setValue('guardianPhone', '+855 ');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending
              ? isEdit
                ? 'Updating...'
                : 'Creating...'
              : isEdit
              ? 'Update Student'
              : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
