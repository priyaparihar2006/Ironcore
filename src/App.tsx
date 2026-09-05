import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// User Dashboard
import { UserDashboardLayout } from './components/dashboard/UserDashboardLayout';
import { UserOverviewPage } from './pages/dashboard/UserOverviewPage';
import { UserWorkoutsPage } from './pages/dashboard/UserWorkoutsPage';
import { UserProgressPage } from './pages/dashboard/UserProgressPage';
import { UserNutritionPage } from './pages/dashboard/UserNutritionPage';
import { UserMembershipPage } from './pages/dashboard/UserMembershipPage';
import { UserBookingsPage } from './pages/dashboard/UserBookingsPage';
import { UserProfilePage } from './pages/dashboard/UserProfilePage';

// Trainer Dashboard
import { TrainerDashboardLayout } from './components/dashboard/TrainerDashboardLayout';
import { TrainerOverviewPage } from './pages/trainer/TrainerOverviewPage';
import { TrainerClientsPage } from './pages/trainer/TrainerClientsPage';
import { TrainerWorkoutPlansPage } from './pages/trainer/TrainerWorkoutPlansPage';
import { TrainerSchedulePage } from './pages/trainer/TrainerSchedulePage';

// Admin Dashboard
import { AdminDashboardLayout } from './components/dashboard/AdminDashboardLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminTrainersPage } from './pages/admin/AdminTrainersPage';
import { AdminMembershipsPage } from './pages/admin/AdminMembershipsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User / Athlete Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserOverviewPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/workouts"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserWorkoutsPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/progress"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserProgressPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/nutrition"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserNutritionPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/membership"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserMembershipPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bookings"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserBookingsPage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute allowedRoles={['USER', 'TRAINER', 'ADMIN']}>
                <UserDashboardLayout>
                  <UserProfilePage />
                </UserDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Trainer Portal Routes */}
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                <TrainerDashboardLayout>
                  <TrainerOverviewPage />
                </TrainerDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/clients"
            element={
              <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                <TrainerDashboardLayout>
                  <TrainerClientsPage />
                </TrainerDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/plans"
            element={
              <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                <TrainerDashboardLayout>
                  <TrainerWorkoutPlansPage />
                </TrainerDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/schedule"
            element={
              <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                <TrainerDashboardLayout>
                  <TrainerSchedulePage />
                </TrainerDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardLayout>
                  <AdminOverviewPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardLayout>
                  <AdminUsersPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardLayout>
                  <AdminTrainersPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/memberships"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardLayout>
                  <AdminMembershipsPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardLayout>
                  <AdminPaymentsPage />
                </AdminDashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
