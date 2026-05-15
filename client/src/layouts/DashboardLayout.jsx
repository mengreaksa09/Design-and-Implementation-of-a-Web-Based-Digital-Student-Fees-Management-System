import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'accountant';

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Students', href: '/admin/students', icon: UserGroupIcon },
    { name: 'Departments', href: '/admin/departments', icon: AcademicCapIcon },
    { name: 'Courses', href: '/admin/courses', icon: BookOpenIcon },
    {
      name: 'Fee Structures',
      href: '/admin/fee-structures',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Fee Assignments',
      href: '/admin/fee-assignments',
      icon: ClipboardDocumentListIcon,
    },
    { name: 'Payments', href: '/admin/payments', icon: CreditCardIcon },
    { name: 'Users', href: '/admin/users', icon: UserCircleIcon },
    {
      name: 'Telegram Bot',
      href: '/admin/telegram',
      icon: ChatBubbleLeftRightIcon,
    },
    { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon },
  ];

  const studentNavigation = [
    { name: 'Dashboard', href: '/student', icon: HomeIcon },
    { name: 'My Fees', href: '/student/fees', icon: CurrencyDollarIcon },
    {
      name: 'Payment History',
      href: '/student/payments',
      icon: CreditCardIcon,
    },
  ];

  const navigation = isAdmin ? adminNavigation : studentNavigation;
  const basePath = isAdmin ? '/admin' : '/student';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? '' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-primary-700">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-8 w-8 text-white" />
              <span className="text-lg font-bold text-white">FeesPro</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-100 hover:bg-primary-600'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-primary-700 overflow-y-auto">
          <div className="flex h-16 items-center px-4 border-b border-primary-600">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">FeesPro</span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-100 hover:bg-primary-600'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-primary-600">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-primary-200 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <Link
                to={`${basePath}/notifications`}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
              </Link>

              <Link
                to={`${basePath}/profile`}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <UserCircleIcon className="h-6 w-6" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
