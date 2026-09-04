import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Dashboard & Module Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ModulePlaceholderPage } from './pages/dashboard/ModulePlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Root Application Component with Routes Configuration
 */
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />

          {/* Protected Application Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Overview */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Operations Modules */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr_manager']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'hr_manager', 'project_manager', 'employee']}
                >
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute allowedRoles={['admin', 'project_manager']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute allowedRoles={['admin', 'project_manager', 'employee']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />

            {/* Finance & Sales Modules */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />

            {/* AI Assistant Module */}
            <Route
              path="/assistant"
              element={
                <ProtectedRoute
                  allowedRoles={['admin', 'hr_manager', 'project_manager', 'employee', 'accountant']}
                >
                  <ModulePlaceholderPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Root Redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
