
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { Layout } from '@/components/Layout/Layout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Equipment from '@/pages/Equipment';
import EquipmentDetail from '@/pages/EquipmentDetail';
import EquipmentForm from '@/pages/EquipmentForm';
import Profile from '@/pages/Profile';
import OrganizationSettings from '@/pages/OrganizationSettings';
import TeamManagement from '@/pages/TeamManagement';
import MyInvitations from '@/pages/MyInvitations';
import InvitationPage from '@/pages/InvitationPage';
import NotFound from '@/pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/invitation/:token" element={<InvitationPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/equipment/new" element={<EquipmentForm />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/equipment/:id/edit" element={<EquipmentForm />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings/organization" element={<OrganizationSettings />} />
                <Route path="/teams" element={<TeamManagement />} />
                <Route path="/invitations" element={<MyInvitations />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
