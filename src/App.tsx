import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ManageLayout from './components/layout/ManageLayout';
import ExtensionsPage from './pages/ExtensionsPage';
import ExtensionDetailPage from './pages/ExtensionDetailPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import ApiKeysPage from './pages/ApiKeysPage';
import ActionsPage from './pages/ActionsPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/jobs" replace />} />
                <Route element={<ProtectedRoute permission="view_analytics" />}>
                  <Route path="/analytics" element={<AnalyticsPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="view_jobs" />}>
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/jobs/:jobId" element={<JobDetailPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="view_companies" />}>
                  <Route path="/companies" element={<CompaniesPage />} />
                  <Route path="/companies/detail" element={<CompanyDetailPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="manage_extensions" />}>
                  <Route path="/extensions" element={<ExtensionsPage />} />
                  <Route path="/extensions/:extensionId" element={<ExtensionDetailPage />} />
                </Route>
                <Route path="/manage" element={<ManageLayout />}>
                  <Route index element={<Navigate to="/manage/users" replace />} />
                  <Route element={<ProtectedRoute permission="manage_users" />}>
                    <Route path="users" element={<UsersPage />} />
                  </Route>
                  <Route element={<ProtectedRoute permission="manage_api_keys" />}>
                    <Route path="api-keys" element={<ApiKeysPage />} />
                  </Route>
                  <Route element={<ProtectedRoute permission="manage_actions" />}>
                    <Route path="actions" element={<ActionsPage />} />
                  </Route>
                </Route>
                <Route path="/users" element={<Navigate to="/manage/users" replace />} />
                <Route path="/api-keys" element={<Navigate to="/manage/api-keys" replace />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/jobs" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
