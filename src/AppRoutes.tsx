
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AuthRedirect } from './components/Auth/AuthRedirect';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentForm from './pages/EquipmentForm';
import EquipmentQR from './pages/EquipmentQR';
import TeamManagement from './pages/TeamManagement';
import Profile from './pages/Profile';
import OrganizationSettings from './pages/OrganizationSettings';
import InvitationPage from './pages/InvitationPage';
import MyInvitations from './pages/MyInvitations';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invitation/:token" element={<InvitationPage />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
      <Route path="/equipment/new" element={<ProtectedRoute><EquipmentForm /></ProtectedRoute>} />
      <Route path="/equipment/:id" element={<ProtectedRoute><EquipmentDetail /></ProtectedRoute>} />
      <Route path="/equipment/:id/edit" element={<ProtectedRoute><EquipmentForm /></ProtectedRoute>} />
      <Route path="/equipment/:id/qr" element={<ProtectedRoute><EquipmentQR /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/organization" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
      <Route path="/invitations" element={<ProtectedRoute><MyInvitations /></ProtectedRoute>} />
      
      {/* Fallback routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
