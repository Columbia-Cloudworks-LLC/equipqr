
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import TeamManagement from '@/pages/TeamManagement';
import OrganizationSettings from '@/pages/OrganizationSettings';
import Equipment from '@/pages/Equipment';
import EquipmentDetail from '@/pages/EquipmentDetail';
import EquipmentForm from '@/pages/EquipmentForm';
import MyInvitations from '@/pages/MyInvitations';
import InvitationPage from '@/pages/invitation/InvitationPage';
import NotFound from '@/pages/NotFound';

export default function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Index /> : <Navigate to="/auth" />} />
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
      <Route path="/teams" element={user ? <TeamManagement /> : <Navigate to="/auth" />} />
      <Route path="/organization" element={user ? <OrganizationSettings /> : <Navigate to="/auth" />} />
      <Route path="/settings/organization" element={user ? <OrganizationSettings /> : <Navigate to="/auth" />} />
      <Route path="/equipment" element={user ? <Equipment /> : <Navigate to="/auth" />} />
      <Route path="/equipment/new" element={user ? <EquipmentForm /> : <Navigate to="/auth" />} />
      <Route path="/equipment/:id" element={user ? <EquipmentDetail /> : <Navigate to="/auth" />} />
      <Route path="/equipment/:id/edit" element={user ? <EquipmentForm /> : <Navigate to="/auth" />} />
      <Route path="/invitations" element={user ? <MyInvitations /> : <Navigate to="/auth" />} />
      <Route path="/invitation/:token" element={<InvitationPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
