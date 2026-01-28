import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      toast.success('Registration successful!');
      navigate('/student');
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <AcademicCapIcon className="h-10 w-10 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">FeesPro</span>
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-gray-600">
              Start managing your fees digitally
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`input ${
                    errors.firstName ? 'border-red-500' : ''
                  }`}
                  placeholder="John"
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="label">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Doe"
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase();
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone number (optional)
              </label>
              <input
                id="phone"
                type="tel"
                className="input"
                placeholder="+1 (555) 000-0000"
                {...register('phone')}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`input ${
                  errors.confirmPassword ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 rounded border-gray-300 mt-1"
                {...register('terms', {
                  required: 'You must accept the terms',
                })}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms.message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-primary-600 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join FeesPro Today</h2>
          <p className="text-primary-100 text-lg">
            Create your account and start managing your educational fees
            efficiently. Access payment history, download receipts, and stay
            updated on due dates.
          </p>
          <div className="mt-12 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-primary-100">
                View all your fees in one place
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-primary-100">Pay securely online</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-primary-100">
                Download instant receipts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-primary-100">Get timely reminders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
