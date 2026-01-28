import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  AcademicCapIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmailSent(true);
      toast.success('Password reset link sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmail = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: getValues('email') });
      toast.success('Reset link resent!');
    } catch (error) {
      toast.error('Failed to resend link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <AcademicCapIcon className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FeesPro</span>
          </Link>

          {!emailSent ? (
            <>
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <EnvelopeIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Forgot password?
              </h2>
              <p className="mt-2 text-gray-600">
                No worries, we'll send you reset instructions.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-gray-600">
                We sent a password reset link to
                <br />
                <span className="font-medium text-gray-900">
                  {getValues('email')}
                </span>
              </p>
            </>
          )}
        </div>

        {!emailSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? 'Sending...' : 'Reset password'}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <button
              onClick={resendEmail}
              disabled={isLoading}
              className="w-full btn-primary py-3"
            >
              {isLoading ? 'Sending...' : 'Resend email'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Didn't receive the email?{' '}
              <button
                onClick={resendEmail}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Click to resend
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
