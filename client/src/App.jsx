import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import TelegramAuth from './components/TelegramAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import StudentForm from './pages/admin/StudentForm';
import StudentView from './pages/admin/StudentView';
import Departments from './pages/admin/Departments';
import Courses from './pages/admin/Courses';
import FeeStructures from './pages/admin/FeeStructures';
import FeeAssignments from './pages/admin/FeeAssignments';
import PaymentManagement from './pages/admin/PaymentManagement';
import UserManagement from './pages/admin/UserManagement';
import TelegramNotifications from './pages/admin/TelegramNotifications';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import MyFees from './pages/student/MyFees';
import PaymentHistory from './pages/student/PaymentHistory';
import MakePayment from './pages/student/MakePayment';

// Common Pages
import Profile from './pages/common/Profile';
import Notifications from './pages/common/Notifications';
import NotFound from './pages/common/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Check if running in Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Auto-authenticate Telegram user
      const initData = tg.initDataUnsafe;
      if (initData?.user) {
        // Store Telegram user info for auto-login
        const telegramUser = {
          id: initData.user.id,
          firstName: initData.user.first_name,
          lastName: initData.user.last_name || '',
          username: initData.user.username || '',
        };
        sessionStorage.setItem('telegramUser', JSON.stringify(telegramUser));
      }
    }
  }, []);

  return (
    <TelegramAuth>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route
            path="login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={user?.role === 'student' ? '/student' : '/admin'}
                />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="register"
            element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />}
          />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Admin/Accountant Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="students/new" element={<StudentForm />} />
          <Route path="students/:id" element={<StudentView />} />
          <Route path="students/:id/edit" element={<StudentForm />} />
          <Route path="departments" element={<Departments />} />
          <Route path="courses" element={<Courses />} />
          <Route path="fee-structures" element={<FeeStructures />} />
          <Route path="fee-assignments" element={<FeeAssignments />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="telegram" element={<TelegramNotifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student', 'parent']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="fees" element={<MyFees />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="pay/:feeAssignmentId" element={<MakePayment />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TelegramAuth>
  );
}

export default App;
