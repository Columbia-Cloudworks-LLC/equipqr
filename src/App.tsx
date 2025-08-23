
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import WorkOrders from './pages/WorkOrders';
import Equipment from './pages/Equipment';
import Teams from './pages/Teams';
import { OrganizationSettings } from './pages/OrganizationSettings';
import { ProfileSettings } from './pages/ProfileSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { AppLayout } from './components/layout/AppLayout';
import { CreateTeam } from './pages/CreateTeam';
import { EditTeam } from './pages/EditTeam';
import { CreateEquipment } from './pages/CreateEquipment';
import { EditEquipment } from './pages/EditEquipment';
import { CreateWorkOrder } from './pages/CreateWorkOrder';
import { EditWorkOrder } from './pages/EditWorkOrder';
import { OrganizationProvider } from './context/OrganizationContext';
import Customers from './pages/Customers';
import { ConditionalCustomersRoute } from './components/ConditionalCustomersRoute';

const queryClient = new QueryClient();

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <Home />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/work-orders" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <WorkOrders />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/equipment" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <Equipment />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/teams" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <Teams />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/teams/create" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <CreateTeam />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/teams/edit/:id" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <EditTeam />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/equipment/create" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <CreateEquipment />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/equipment/edit/:id" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <EditEquipment />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/work-orders/create" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <CreateWorkOrder />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/work-orders/edit/:id" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <EditWorkOrder />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/organization-settings" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <OrganizationSettings />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />

          <Route path="/profile-settings" element={
            user ? (
              <OrganizationProvider>
                <AppLayout>
                  <ProfileSettings />
                </AppLayout>
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />
          
          <Route path="/customers" element={
            user ? (
              <OrganizationProvider>
                <ConditionalCustomersRoute />
              </OrganizationProvider>
            ) : (
              <Login />
            )
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
