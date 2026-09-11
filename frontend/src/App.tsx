import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// Public Pages
import { LandingPage } from './pages/LandingPage';

// Dashboard & Module Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesPage } from './pages/employees/EmployeesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { QuotationsPage } from './pages/quotations/QuotationsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { AIAssistantPage } from './pages/assistant/AIAssistantPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Root Application Component with Routes Configuration & Providers
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
                  <ProtectedRoute allowedRoles={['admin', 'hr_manager', 'project_manager']}>
                    <EmployeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute
                    allowedRoles={['admin', 'hr_manager', 'project_manager', 'employee']}
                  >
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'project_manager', 'hr_manager']}>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'project_manager', 'employee', 'hr_manager']}>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />

              {/* Finance & Sales Modules */}
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                    <CustomersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                    <QuotationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                    <InvoicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant', 'customer']}>
                    <PaymentsPage />
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
                    <AIAssistantPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
};

export default App;
