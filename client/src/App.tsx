import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminSupport from './pages/AdminSupport';
import Accounts from './pages/Accounts';
import Transfer from './pages/Transfer';
import CheckDeposit from './pages/CheckDeposit';
import Payments from './pages/Payments';
import CardServices from './pages/CardServices';
import Profile from './pages/Profile';
import Support from './pages/Support';
// import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin routes (accessible without auth) */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        
        {/* Protected routes with layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
        </Route>
        
        {/* Individual protected routes */}
        <Route path="/accounts" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Accounts />} />
        </Route>
        
        <Route path="/transfer" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Transfer />} />
        </Route>
        
        <Route path="/check-deposit" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CheckDeposit />} />
        </Route>
        
        <Route path="/payments" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Payments />} />
        </Route>
        
        <Route path="/card-services" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<CardServices />} />
        </Route>
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Profile />} />
        </Route>
        
        <Route path="/support" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Support />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
