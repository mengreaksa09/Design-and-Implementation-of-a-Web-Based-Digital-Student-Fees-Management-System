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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const result = await login(data.email, data.password);
      toast.success('Login successful!');

      // Redirect based on role
      if (result.user.role === 'student' || result.user.role === 'parent') {
        navigate('/student');
      } else {
        navigate('/admin');
      }
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
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

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
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-primary-600 items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Manage Fees Digitally</h2>
          <p className="text-primary-100 text-lg">
            Streamline your institution's fee collection process with our
            comprehensive digital solution. Track payments, generate reports,
            and reduce paperwork.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-left">
            <div className="bg-primary-500 rounded-lg p-4">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-primary-200">Institutions</div>
            </div>
            <div className="bg-primary-500 rounded-lg p-4">
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-primary-200">Students</div>
            </div>
            <div className="bg-primary-500 rounded-lg p-4">
              <div className="text-2xl font-bold">$10M+</div>
              <div className="text-primary-200">Processed</div>
            </div>
            <div className="bg-primary-500 rounded-lg p-4">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-primary-200">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
