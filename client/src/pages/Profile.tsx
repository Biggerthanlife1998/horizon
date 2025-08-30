import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import { 
  User, 
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredDisplayName?: string;
  address?: string;
  phoneNumber?: string;
  profilePicture?: string;
  securityQuestion: string;
  securityAnswer: string;
  transferPin: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PinForm {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pinForm, setPinForm] = useState<PinForm>({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setRefreshLoading(true);
      } else {
        setLoading(true);
      }
      const response = await api.get('/user/profile');
      setUser(response.data.user);
      setError(null);
      
      // Show success message when refreshing
      if (showRefreshLoading) {
        setToast({ type: 'success', message: 'Profile data refreshed successfully!' });
        // Clear toast after 3 seconds
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load profile data');
    } finally {
      if (showRefreshLoading) {
        setRefreshLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Refresh profile data when page becomes visible (user navigates back to profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Page became visible, refresh profile data
        fetchUserProfile(true);
      }
    };

    const handleFocus = () => {
      if (user) {
        // Window gained focus, refresh profile data
        fetchUserProfile(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'currentPassword' || name === 'newPassword' || name === 'confirmPassword') {
      setPasswordForm(prev => ({ ...prev, [name]: value }));
    } else if (name === 'currentPin' || name === 'newPin' || name === 'confirmPin') {
      setPinForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setToast(null);

    try {
      // Validate passwords match
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setToast({ type: 'error', message: 'New passwords do not match' });
        return;
      }

      // Validate password strength
      if (passwordForm.newPassword.length < 8) {
        setToast({ type: 'error', message: 'Password must be at least 8 characters long' });
        return;
      }

      // Call API to change password
      await api.put('/user/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setToast({ type: 'success', message: 'Password updated successfully!' });
    } catch (error: any) {
      console.error('Password change failed:', error);
      const message = error.response?.data?.message || 'Password change failed. Please try again.';
      setToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setToast(null);

    try {
      // Validate PINs match
      if (pinForm.newPin !== pinForm.confirmPin) {
        setToast({ type: 'error', message: 'New PINs do not match' });
        return;
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pinForm.newPin)) {
        setToast({ type: 'error', message: 'PIN must be exactly 4 digits' });
        return;
      }

      // Validate PIN is not sequential or repetitive
      if (pinForm.newPin === '1234' || pinForm.newPin === '4321' || 
          pinForm.newPin === '1111' || pinForm.newPin === '2222' || 
          pinForm.newPin === '3333' || pinForm.newPin === '4444' ||
          pinForm.newPin === '5555' || pinForm.newPin === '6666' ||
          pinForm.newPin === '7777' || pinForm.newPin === '8888' ||
          pinForm.newPin === '9999' || pinForm.newPin === '0000') {
        setToast({ type: 'error', message: 'PIN cannot be sequential or repetitive' });
        return;
      }

      // Call API to change transfer PIN
      await api.put('/user/transfer-pin', {
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin
      });

      // Update local state
      if (user) {
        setUser(prev => prev ? { ...prev, transferPin: pinForm.newPin } : null);
      }

      // Reset form
      setPinForm({
        currentPin: '',
        newPin: '',
        confirmPin: ''
      });
      setShowPinModal(false);
      setToast({ type: 'success', message: 'Transfer PIN updated successfully!' });
    } catch (error: any) {
      console.error('PIN change failed:', error);
      const message = error.response?.data?.message || 'PIN change failed. Please try again.';
      setToast({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  // Profile picture upload removed - only admin can change profile info

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Loading your profile information...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Error loading profile information.</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error || 'Failed to load profile data'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and security settings.</p>
        </div>
        <button
          onClick={() => fetchUserProfile(true)}
          disabled={refreshLoading}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
          <span>{refreshLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`p-4 rounded-lg border ${
          toast.type === 'success' 
            ? 'bg-success-50 border-success-200 text-success-800' 
            : 'bg-error-50 border-error-200 text-error-800'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Admin Update Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Profile Updates</h4>
            <p className="text-sm text-blue-700 mt-1">
              If an administrator has updated your profile information, click the "Refresh" button above to see the latest changes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img 
                      src={`http://localhost:4000${user.profilePicture}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="text-gray-900 font-medium">{user.firstName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="text-gray-900 font-medium">{user.lastName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="text-gray-900 font-medium">{user.username}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900 font-medium">{user.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Security Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Question</label>
                <div className="text-gray-900 mb-2">{user.securityQuestion}</div>
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-gray-700">Answer:</label>
                  <div className="text-gray-900 font-mono">
                    {showSecurityAnswer ? user.securityAnswer : '••••••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Transfer PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer PIN</label>
                <div className="flex items-center space-x-2">
                  <div className="text-gray-900 font-mono">
                    {showCurrentPin ? user.transferPin : '••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <LoadingButton
                  loading={false}
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-primary"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </LoadingButton>
                <LoadingButton
                  loading={false}
                  onClick={() => setShowPinModal(true)}
                  className="btn-secondary"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Transfer PIN
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="space-y-6">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Security Tips</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• Use a strong, unique password</li>
                  <li>• Never share your transfer PIN</li>
                  <li>• Keep your security answer private</li>
                  <li>• Enable two-factor authentication</li>
                  <li>• Monitor your account regularly</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Notes</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Password changes take effect immediately</li>
                  <li>• Transfer PIN must be exactly 4 digits</li>
                  <li>• Keep your security information private</li>
                  <li>• Contact support if you forget your PIN</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <FormInput
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={handleInputChange}
            placeholder="Enter current password"
            required
          />

          <FormInput
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={handleInputChange}
            placeholder="Enter new password"
            required
          />

          <FormInput
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            required
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Password Requirements</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Include at least one number</li>
                  <li>• Include at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <LoadingButton
              loading={false}
              onClick={() => setShowPasswordModal(false)}
              className="btn-secondary"
              type="button"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              loading={actionLoading}
              type="submit"
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Password
            </LoadingButton>
          </div>
        </form>
      </Modal>

      {/* Change Transfer PIN Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="Change Transfer PIN"
      >
        <form onSubmit={handlePinChange} className="space-y-6">
          <FormInput
            label="Current Transfer PIN"
            name="currentPin"
            type="password"
            value={pinForm.currentPin}
            onChange={handleInputChange}
            placeholder="Enter current 4-digit PIN"
            required
            maxLength={4}
            pattern="[0-9]{4}"
          />

          <FormInput
            label="New Transfer PIN"
            name="newPin"
            type="password"
            value={pinForm.newPin}
            onChange={handleInputChange}
            placeholder="Enter new 4-digit PIN"
            required
            maxLength={4}
            pattern="[0-9]{4}"
          />

          <FormInput
            label="Confirm New Transfer PIN"
            name="confirmPin"
            type="password"
            value={pinForm.confirmPin}
            onChange={handleInputChange}
            placeholder="Confirm new 4-digit PIN"
            required
            maxLength={4}
            pattern="[0-9]{4}"
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">PIN Requirements</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Must be exactly 4 digits (0-9)</li>
                  <li>• Cannot be sequential (1234, 4321)</li>
                  <li>• Cannot be repetitive (1111, 2222)</li>
                  <li>• Keep your PIN secure and private</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <LoadingButton
              loading={false}
              onClick={() => setShowPinModal(false)}
              className="btn-secondary"
              type="button"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              loading={actionLoading}
              type="submit"
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Update PIN
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}








