import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ExtensionsPage from './pages/ExtensionsPage';
import ExtensionDetailPage from './pages/ExtensionDetailPage';

const App: React.FC = () => {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<ExtensionsPage />} />
            <Route path="/extensions/:extensionId" element={<ExtensionDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
