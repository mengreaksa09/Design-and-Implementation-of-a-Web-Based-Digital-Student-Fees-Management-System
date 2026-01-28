import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Digital Fee Management',
    description:
      'Manage all types of fees including tuition, exam, library, transport, and more in one place.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Online Payments',
    description:
      'Accept payments via credit cards, mobile payments, and bank transfers securely.',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Automated Receipts',
    description:
      'Generate and download PDF receipts instantly with QR codes for verification.',
    icon: DocumentCheckIcon,
  },
  {
    name: 'Comprehensive Reports',
    description:
      'Generate daily, monthly, and yearly reports. Export to Excel or PDF easily.',
    icon: ChartBarIcon,
  },
  {
    name: 'Role-Based Access',
    description:
      'Secure access for administrators, accountants, students, and parents.',
    icon: ShieldCheckIcon,
  },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                FeesPro
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to={
                    user?.role === 'student' || user?.role === 'parent'
                      ? '/student'
                      : '/admin'
                  }
                  className="btn-primary"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              Digital Student Fees
              <span className="text-primary-600"> Management System</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive web-based solution for schools, colleges, and
              universities to manage student fees digitally, reduce paperwork,
              track payments, and generate reports easily.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
              >
                Get Started <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full" />
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden mx-auto max-w-5xl">
              <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
              <div className="p-4 bg-gray-100">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Students</div>
                    <div className="text-2xl font-bold text-gray-900">
                      1,234
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Collected</div>
                    <div className="text-2xl font-bold text-green-600">
                      $125,000
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Pending Fees</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      $45,000
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Overdue</div>
                    <div className="text-2xl font-bold text-red-600">
                      $8,500
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to manage fees
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to streamline your institution's fee management
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to digitize your fee management?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join hundreds of institutions already using FeesPro
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Start Free Trial <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-8 w-8 text-white" />
                <span className="text-xl font-bold text-white">FeesPro</span>
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                Digital Student Fees Management System for modern educational
                institutions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>info@feespro.com</li>
                <li>+1 (555) 123-4567</li>
                <li>123 Education Street</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} FeesPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
