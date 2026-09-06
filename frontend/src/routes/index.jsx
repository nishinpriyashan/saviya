import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RegisterGN from '../pages/auth/RegisterGN';
import BeneficiaryDashboard from '../pages/beneficiary/Dashboard';
import NewRequest from '../pages/beneficiary/NewRequest';
import RequestDetails from '../pages/beneficiary/RequestDetails';
import ProfileSetup from '../pages/beneficiary/ProfileSetup';
import DonorDashboard from '../pages/donor/Dashboard';
import DonationPage from '../pages/donor/DonationPage';
import GnDashboard from '../pages/gn/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading Saviya...</p>
      </div>
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (currentUser && userData) {
    switch (userData.role) {
      case 'beneficiary': return <Navigate to="/beneficiary" replace />;
      case 'donor':       return <Navigate to="/donor" replace />;
      case 'gn':          return <Navigate to="/gn" replace />;
      case 'admin':       return <Navigate to="/admin" replace />;
      default:            return <Navigate to="/" replace />;
    }
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Auth Routes */}
      <Route path="/login" element={
        <PublicOnlyRoute><Login /></PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute><Register /></PublicOnlyRoute>
      } />
      <Route path="/register/gn" element={
        <PublicOnlyRoute><RegisterGN /></PublicOnlyRoute>
      } />

      {/* Beneficiary Routes */}
      <Route path="/beneficiary" element={
        <ProtectedRoute allowedRoles={['beneficiary']}>
          <BeneficiaryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/beneficiary/profile/setup" element={
        <ProtectedRoute allowedRoles={['beneficiary']}>
          <ProfileSetup />
        </ProtectedRoute>
      } />
      <Route path="/beneficiary/request/new" element={
        <ProtectedRoute allowedRoles={['beneficiary']}>
          <NewRequest />
        </ProtectedRoute>
      } />
      <Route path="/beneficiary/request/:id" element={
        <ProtectedRoute allowedRoles={['beneficiary']}>
          <RequestDetails />
        </ProtectedRoute>
      } />

      {/* Donor Routes */}
      <Route path="/donor" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <DonorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/donor/request/:id" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <DonationPage />
        </ProtectedRoute>
      } />

      {/* GN Routes */}
      <Route path="/gn/*" element={
        <ProtectedRoute allowedRoles={['gn']}>
          <GnDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
