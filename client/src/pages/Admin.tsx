import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, DollarSign, History, Users, Search, Plus, Minus, XCircle, MessageSquare, Edit } from 'lucide-react';

interface CreateUserForm {
  firstName: string;
  lastName: string;
  preferredDisplayName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  checkingBalance: number;
  savingsBalance: number;
  creditLimit: number;
  includeTransactionHistory: boolean;
  isAdmin: boolean;
  profilePicture?: File;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

interface CreditAlertForm {
  userId: string;
  accountType: 'checking' | 'savings' | 'credit';
  amount: string;
  note: string;
  alertName: string;
}

interface DebitAlertForm {
  userId: string;
  accountType: 'checking' | 'savings' | 'credit';
  amount: string;
  note: string;
  alertName: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  preferredDisplayName?: string;
  address?: string;
  phoneNumber?: string;
  username: string;
  email: string;
  account?: {
    totalBalance: number;
    accountDistribution: {
      checking: number;
      savings: number;
      credit: number;
    };
  };
}

interface CreditHistoryItem {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    username: string;
  };
  accountId: string;
  amount: number;
  description: string;
  transactionDate: string;
  metadata: {
    note: string;
    oldBalance: number;
    newBalance: number;
  };
}

interface DebitHistoryItem {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    username: string;
  };
  accountId: string;
  amount: number;
  description: string;
  transactionDate: string;
  metadata: {
    note: string;
    oldBalance: number;
    newBalance: number;
  };
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'credit-alert' | 'edit-user'>('users');
  
  // User Management State
  const [form, setForm] = useState<CreateUserForm>({
    firstName: '',
    lastName: '',
    preferredDisplayName: '',
    address: '',
    phoneNumber: '',
    email: '',
    username: '',
    password: '',
    checkingBalance: 0,
    savingsBalance: 0,
    creditLimit: 0,
    includeTransactionHistory: false,
    isAdmin: false,
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Credit Alert State
  const [creditForm, setCreditForm] = useState<CreditAlertForm>({
    userId: '',
    accountType: 'checking',
    amount: '',
    note: '',
    alertName: ''
  });
  const [debitForm, setDebitForm] = useState<DebitAlertForm>({
    userId: '',
    accountType: 'checking',
    amount: '',
    note: '',
    alertName: ''
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [debitLoading, setDebitLoading] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>([]);
  const [debitHistory, setDebitHistory] = useState<DebitHistoryItem[]>([]);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [showDebitHistory, setShowDebitHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Edit User State
  const [editUserSearch, setEditUserSearch] = useState('');
  const [editUsers, setEditUsers] = useState<User[]>([]);
  const [filteredEditUsers, setFilteredEditUsers] = useState<User[]>([]);
  const [selectedEditUser, setSelectedEditUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    preferredDisplayName: '',
    address: '',
    phoneNumber: '',
    email: '',
    username: ''
  });
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Fetch users for credit alert
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Use fetch directly to avoid API interceptor redirects
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          console.error('Failed to fetch users:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (adminPassword && activeTab === 'credit-alert') {
      fetchUsers();
    }
  }, [adminPassword, activeTab]);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearch, users]);

  // Fetch users for edit user
  useEffect(() => {
    const fetchEditUsers = async () => {
      if (activeTab === 'edit-user' && editAdminPassword) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Password': editAdminPassword
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setEditUsers(data.users);
            setFilteredEditUsers(data.users);
          }
        } catch (error) {
          console.error('Failed to fetch users for edit:', error);
        }
      }
    };

    fetchEditUsers();
  }, [activeTab, editAdminPassword]);

  // Filter edit users based on search
  useEffect(() => {
    if (editUserSearch.trim() === '') {
      setFilteredEditUsers(editUsers);
    } else {
      const filtered = editUsers.filter(user => 
        user.firstName.toLowerCase().includes(editUserSearch.toLowerCase()) ||
        user.lastName.toLowerCase().includes(editUserSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(editUserSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(editUserSearch.toLowerCase())
      );
      setFilteredEditUsers(filtered);
    }
  }, [editUserSearch, editUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked, files } = e.target as HTMLInputElement;
    
    if (type === 'file' && files) {
      setForm(prev => ({ ...prev, profilePicture: files[0] }));
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const formData = new FormData();
      
      // Add user data
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('preferredDisplayName', form.preferredDisplayName);
      formData.append('address', form.address);
      formData.append('phoneNumber', form.phoneNumber);
      formData.append('email', form.email);
      formData.append('username', form.username);
      formData.append('password', form.password);
      formData.append('checkingBalance', form.checkingBalance.toString());
      formData.append('savingsBalance', form.savingsBalance.toString());
      formData.append('creditLimit', form.creditLimit.toString());
      formData.append('includeTransactionHistory', form.includeTransactionHistory.toString());
      formData.append('isAdmin', form.isAdmin.toString());
      
      // Add profile picture if selected
      if (form.profilePicture) {
        formData.append('profilePicture', form.profilePicture);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'X-Admin-Password': adminPassword,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          type: 'success',
          message: `User ${data.user.firstName} ${data.user.lastName} created successfully!`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        preferredDisplayName: '',
        address: '',
        phoneNumber: '',
        email: '',
        username: '',
        password: '',
        checkingBalance: 0,
        savingsBalance: 0,
        creditLimit: 0,
        includeTransactionHistory: false,
        isAdmin: false,
      });
      setAdminPassword('');
      
      // Clear file input
      const fileInput = document.getElementById('profilePicture') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setToast({
        type: 'error',
        message: error.message || 'Failed to create user. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Credit Alert Functions
  const handleCreditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDebitInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDebitForm(prev => ({ ...prev, [name]: value }));
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setCreditForm(prev => ({ ...prev, userId: user._id }));
    setDebitForm(prev => ({ ...prev, userId: user._id }));
    setUserSearch('');
  };

  const selectEditUser = (user: User) => {
    setSelectedEditUser(user);
    setEditUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      preferredDisplayName: user.preferredDisplayName || '',
      address: user.address || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email,
      username: user.username
    });
    setEditUserSearch('');
  };

  const handleEditUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleResetPasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;

    setEditUserLoading(true);
    setToast(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/edit-user/${selectedEditUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': editAdminPassword
        },
        body: JSON.stringify(editUserForm)
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'User information updated successfully!' });
        // Refresh the users list
        const usersResponse = await fetch('http://localhost:4000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': editAdminPassword
          }
        });
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setEditUsers(data.users);
          setFilteredEditUsers(data.users);
        }
      } else {
        const errorData = await response.json();
        setToast({ type: 'error', message: errorData.message || 'Failed to update user information' });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setToast({ type: 'error', message: 'Failed to update user information' });
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;

    setResetPasswordLoading(true);
    setToast(null);

    try {
      // Validate passwords match
      if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
        setToast({ type: 'error', message: 'Passwords do not match' });
        return;
      }

      // Validate password strength
      if (resetPasswordForm.newPassword.length < 8) {
        setToast({ type: 'error', message: 'Password must be at least 8 characters long' });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-password/${selectedEditUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': editAdminPassword
        },
        body: JSON.stringify({
          newPassword: resetPasswordForm.newPassword
        })
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'Password reset successfully!' });
        setResetPasswordForm({ newPassword: '', confirmPassword: '' });
        setShowResetPassword(false);
      } else {
        const errorData = await response.json();
        setToast({ type: 'error', message: errorData.message || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      setToast({ type: 'error', message: 'Failed to reset password' });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreditLoading(true);
    setToast(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/credit-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({
          userId: creditForm.userId,
          accountType: creditForm.accountType,
          amount: parseFloat(creditForm.amount),
          note: creditForm.alertName || creditForm.note
        })
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          type: 'success',
          message: `Credit alert processed: $${creditForm.amount} added to ${data.creditAlert.userName}'s ${creditForm.accountType} account`
        });

        // Reset form
        setCreditForm({
          userId: '',
          accountType: 'checking',
          amount: '',
          note: '',
          alertName: ''
        });
        setSelectedUser(null);

        // Refresh users list
        const usersResponse = await fetch('http://localhost:4000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users);
          setFilteredUsers(usersData.users);
        }
      } else {
        const errorData = await response.json();
        setToast({
          type: 'error',
          message: errorData.message || 'Failed to process credit alert. Please try again.'
        });
      }

    } catch (error: any) {
      setToast({
        type: 'error',
        message: 'Failed to process credit alert. Please try again.'
      });
    } finally {
      setCreditLoading(false);
    }
  };

  const handleDebitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebitLoading(true);
    setToast(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/debit-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({
          userId: debitForm.userId,
          accountType: debitForm.accountType,
          amount: parseFloat(debitForm.amount),
          note: debitForm.alertName || debitForm.note
        })
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          type: 'success',
          message: `Debit alert processed: $${debitForm.amount} removed from ${data.debitAlert.userName}'s ${debitForm.accountType} account`
        });

        // Reset form
        setDebitForm({
          userId: '',
          accountType: 'checking',
          amount: '',
          note: '',
          alertName: ''
        });
        setSelectedUser(null);

        // Refresh users list
        const usersResponse = await fetch('http://localhost:4000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users);
          setFilteredUsers(usersData.users);
        }
      } else {
        const errorData = await response.json();
        setToast({
          type: 'error',
          message: errorData.message || 'Failed to process debit alert. Please try again.'
        });
      }

    } catch (error: any) {
      setToast({
        type: 'error',
        message: 'Failed to process debit alert. Please try again.'
      });
    } finally {
      setDebitLoading(false);
    }
  };

  const fetchCreditHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/credit-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.creditHistory);
        setShowCreditHistory(true);
      } else {
        console.error('Failed to fetch credit history:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error);
    }
  };

  const fetchDebitHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/debit-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebitHistory(data.debitHistory);
        setShowDebitHistory(true);
      } else {
        console.error('Failed to fetch debit history:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch debit history:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-primary-800">
        <div className="flex items-center justify-center h-16 border-b border-primary-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-800 font-bold text-lg">H</span>
            </div>
            <h1 className="text-xl font-bold text-white">Horizon Bank Admin</h1>
          </div>
        </div>
        <nav className="p-6 space-y-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'users' 
                ? 'bg-primary-700 text-white' 
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">User Management</span>
          </button>
          
          <button
            onClick={() => setActiveTab('credit-alert')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'credit-alert' 
                ? 'bg-primary-700 text-white' 
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Credit Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('edit-user')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'edit-user' 
                ? 'bg-primary-700 text-white' 
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            }`}
          >
            <Edit className="w-5 h-5" />
            <span className="font-medium">Edit User Info</span>
          </button>

          <a
            href="/admin/support"
            className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-primary-200 hover:bg-primary-700 hover:text-white"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Support Dashboard</span>
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Toast notification */}
          {toast && (
            <div className={`mb-6 p-4 rounded-lg border ${
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

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
                <p className="text-gray-600 mt-2">
                  Add new users to the banking system. Required fields are marked with *.
                </p>
              </div>

              {/* Form */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Admin Password */}
              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Enter admin password to unlock"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {adminPassword && (
                    <button
                      type="button"
                      onClick={() => setAdminPassword('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Preferred Display Name */}
              <div>
                <label htmlFor="preferredDisplayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Display Name *
                </label>
                <input
                  id="preferredDisplayName"
                  name="preferredDisplayName"
                  type="text"
                  required
                  value={form.preferredDisplayName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter preferred display name"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  value={form.address}
                  onChange={handleInputChange}
                  className="input min-h-[80px] resize-none"
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Gmail Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter Gmail address"
                />
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={form.username}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {/* Account Balances */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="checkingBalance" className="block text-sm font-medium text-gray-700 mb-2">
                    Checking Balance *
                  </label>
                  <input
                    id="checkingBalance"
                    name="checkingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.checkingBalance}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="savingsBalance" className="block text-sm font-medium text-gray-700 mb-2">
                    Savings Balance *
                  </label>
                  <input
                    id="savingsBalance"
                    name="savingsBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.savingsBalance}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit *
                  </label>
                  <input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.creditLimit}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Transaction History Option */}
              <div className="flex items-center">
                <input
                  id="includeTransactionHistory"
                  name="includeTransactionHistory"
                  type="checkbox"
                  checked={form.includeTransactionHistory}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="includeTransactionHistory" className="ml-2 block text-sm text-gray-700">
                  Include backdated transaction history
                </label>
              </div>

              {/* Profile Picture */}
              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="profilePicture"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="profilePicture"
                          name="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {form.profilePicture && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {form.profilePicture.name}
                  </p>
                )}
              </div>

              {/* Admin Checkbox */}
              <div className="flex items-center">
                <input
                  id="isAdmin"
                  name="isAdmin"
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
                  Grant admin privileges
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating User...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
            </>
          )}

          {/* Credit Alert Tab */}
          {activeTab === 'credit-alert' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Account Management System</h1>
                <p className="text-gray-600 mt-2">
                  Add or remove money from user accounts. Enter admin password to access.
                </p>
              </div>

              {/* Admin Password */}
              <div className="card mb-6">
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="input"
                    placeholder="Enter admin password to unlock"
                  />
                </div>
              </div>

              {/* User Search and Selection */}
              {adminPassword && (
                <div className="card mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select User</h3>
                  
                  {/* User Search */}
                  <div className="mb-4">
                    <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="userSearch"
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="input pl-10"
                        placeholder="Search by name, username, or email..."
                      />
                    </div>
                  </div>

                  {/* Selected User Display */}
                  {selectedUser && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </h4>
                          <p className="text-sm text-blue-700">@{selectedUser.username}</p>
                          <p className="text-sm text-blue-600">
                            Total Balance: ${selectedUser.account?.totalBalance?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setCreditForm(prev => ({ ...prev, userId: '' }));
                            setDebitForm(prev => ({ ...prev, userId: '' }));
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User List */}
                  {!selectedUser && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredUsers.map(user => (
                        <div
                          key={user._id}
                          onClick={() => selectUser(user)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${user.account?.totalBalance?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-gray-500">
                                C: ${user.account?.accountDistribution?.checking?.toFixed(2) || '0.00'} | 
                                S: ${user.account?.accountDistribution?.savings?.toFixed(2) || '0.00'} | 
                                Cr: ${user.account?.accountDistribution?.credit?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Credit and Debit Forms */}
              {adminPassword && selectedUser && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Credit Form */}
                  <div className="card">
                    <div className="flex items-center mb-4">
                      <Plus className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Add Money (Credit)</h3>
                    </div>
                    
                    <form onSubmit={handleCreditSubmit} className="space-y-4">
                      {/* Alert Name */}
                      <div>
                        <label htmlFor="creditAlertName" className="block text-sm font-medium text-gray-700 mb-2">
                          Alert Name *
                        </label>
                        <input
                          id="creditAlertName"
                          name="alertName"
                          type="text"
                          required
                          value={creditForm.alertName}
                          onChange={handleCreditInputChange}
                          className="input"
                          placeholder="e.g., Bonus Payment, Refund, etc."
                        />
                      </div>

                      {/* Account Type */}
                      <div>
                        <label htmlFor="creditAccountType" className="block text-sm font-medium text-gray-700 mb-2">
                          Account Type *
                        </label>
                        <select
                          id="creditAccountType"
                          name="accountType"
                          required
                          value={creditForm.accountType}
                          onChange={handleCreditInputChange}
                          className="input"
                        >
                          <option value="checking">Checking Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="credit">Credit Limit</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label htmlFor="creditAmount" className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (USD) *
                        </label>
                        <input
                          id="creditAmount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={creditForm.amount}
                          onChange={handleCreditInputChange}
                          className="input"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label htmlFor="creditNote" className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Note (Optional)
                        </label>
                        <textarea
                          id="creditNote"
                          name="note"
                          value={creditForm.note}
                          onChange={handleCreditInputChange}
                          className="input"
                          rows={2}
                          placeholder="Additional details..."
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={creditLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {creditLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Money
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Debit Form */}
                  <div className="card">
                    <div className="flex items-center mb-4">
                      <Minus className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Remove Money (Debit)</h3>
                    </div>
                    
                    <form onSubmit={handleDebitSubmit} className="space-y-4">
                      {/* Alert Name */}
                      <div>
                        <label htmlFor="debitAlertName" className="block text-sm font-medium text-gray-700 mb-2">
                          Alert Name *
                        </label>
                        <input
                          id="debitAlertName"
                          name="alertName"
                          type="text"
                          required
                          value={debitForm.alertName}
                          onChange={handleDebitInputChange}
                          className="input"
                          placeholder="e.g., Fee, Penalty, Adjustment, etc."
                        />
                      </div>

                      {/* Account Type */}
                      <div>
                        <label htmlFor="debitAccountType" className="block text-sm font-medium text-gray-700 mb-2">
                          Account Type *
                        </label>
                        <select
                          id="debitAccountType"
                          name="accountType"
                          required
                          value={debitForm.accountType}
                          onChange={handleDebitInputChange}
                          className="input"
                        >
                          <option value="checking">Checking Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="credit">Credit Limit</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label htmlFor="debitAmount" className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (USD) *
                        </label>
                        <input
                          id="debitAmount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={debitForm.amount}
                          onChange={handleDebitInputChange}
                          className="input"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label htmlFor="debitNote" className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Note (Optional)
                        </label>
                        <textarea
                          id="debitNote"
                          name="note"
                          value={debitForm.note}
                          onChange={handleDebitInputChange}
                          className="input"
                          rows={2}
                          placeholder="Additional details..."
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={debitLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {debitLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4 mr-2" />
                            Remove Money
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* History Buttons */}
              {adminPassword && (
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={fetchCreditHistory}
                    className="btn-secondary flex items-center"
                  >
                    <History className="w-4 h-4 mr-2" />
                    View Credit History
                  </button>
                  
                  <button
                    onClick={fetchDebitHistory}
                    className="btn-secondary flex items-center"
                  >
                    <History className="w-4 h-4 mr-2" />
                    View Debit History
                  </button>
                </div>
              )}

              {/* Credit History Modal */}
              {showCreditHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Credit Alert History</h2>
                      <button
                        onClick={() => setShowCreditHistory(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {creditHistory.map((item) => (
                        <div key={item._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {item.userId.firstName} {item.userId.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">@{item.userId.username}</p>
                              <p className="text-sm text-gray-500 mt-1">{item.metadata.note}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                +${item.amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {item.accountId} Account
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(item.transactionDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Debit History Modal */}
              {showDebitHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Debit Alert History</h2>
                      <button
                        onClick={() => setShowDebitHistory(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {debitHistory.map((item) => (
                        <div key={item._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {item.userId.firstName} {item.userId.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">@{item.userId.username}</p>
                              <p className="text-sm text-gray-500 mt-1">{item.metadata.note}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">
                                -${Math.abs(item.amount).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {item.accountId} Account
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(item.transactionDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit User Tab */}
          {activeTab === 'edit-user' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Edit User Information</h1>
                <p className="text-gray-600 mt-2">
                  Search for users and update their personal information. Enter admin password to access.
                </p>
              </div>

              {/* Admin Password */}
              <div className="card mb-6">
                <div>
                  <label htmlFor="editAdminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      id="editAdminPassword"
                      name="editAdminPassword"
                      type="password"
                      required
                      value={editAdminPassword}
                      onChange={(e) => setEditAdminPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="Enter admin password to unlock"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {editAdminPassword && (
                      <button
                        type="button"
                        onClick={() => setEditAdminPassword('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Search and Selection */}
              {editAdminPassword && (
                <div className="card mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select User to Edit</h3>
                  
                  {/* User Search */}
                  <div className="mb-4">
                    <label htmlFor="editUserSearch" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="editUserSearch"
                        type="text"
                        value={editUserSearch}
                        onChange={(e) => setEditUserSearch(e.target.value)}
                        className="input pl-10"
                        placeholder="Search by name, username, or email..."
                      />
                    </div>
                  </div>

                  {/* Selected User Display */}
                  {selectedEditUser && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            {selectedEditUser.firstName} {selectedEditUser.lastName}
                          </h4>
                          <p className="text-sm text-blue-700">@{selectedEditUser.username}</p>
                          <p className="text-sm text-blue-600">{selectedEditUser.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEditUser(null);
                            setEditUserForm({
                              firstName: '',
                              lastName: '',
                              preferredDisplayName: '',
                              address: '',
                              phoneNumber: '',
                              email: '',
                              username: ''
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User List */}
                  {!selectedEditUser && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredEditUsers.map(user => (
                        <div
                          key={user._id}
                          onClick={() => selectEditUser(user)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {user.preferredDisplayName || 'No display name'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.phoneNumber || 'No phone'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Edit User Form */}
              {editAdminPassword && selectedEditUser && (
                <div className="card">
                  <div className="flex items-center mb-6">
                    <Edit className="w-6 h-6 text-primary-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Edit User Information</h3>
                  </div>
                  
                  <form onSubmit={handleEditUserSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          id="editFirstName"
                          name="firstName"
                          type="text"
                          required
                          value={editUserForm.firstName}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          id="editLastName"
                          name="lastName"
                          type="text"
                          required
                          value={editUserForm.lastName}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter last name"
                        />
                      </div>

                      <div>
                        <label htmlFor="editPreferredDisplayName" className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Display Name
                        </label>
                        <input
                          id="editPreferredDisplayName"
                          name="preferredDisplayName"
                          type="text"
                          value={editUserForm.preferredDisplayName}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter preferred display name"
                        />
                      </div>

                      <div>
                        <label htmlFor="editUsername" className="block text-sm font-medium text-gray-700 mb-2">
                          Username *
                        </label>
                        <input
                          id="editUsername"
                          name="username"
                          type="text"
                          required
                          value={editUserForm.username}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter username"
                        />
                      </div>

                      <div>
                        <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          id="editEmail"
                          name="email"
                          type="email"
                          required
                          value={editUserForm.email}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label htmlFor="editPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          id="editPhoneNumber"
                          name="phoneNumber"
                          type="tel"
                          value={editUserForm.phoneNumber}
                          onChange={handleEditUserInputChange}
                          className="input"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        id="editAddress"
                        name="address"
                        value={editUserForm.address}
                        onChange={handleEditUserInputChange}
                        className="input"
                        rows={3}
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEditUser(null);
                          setEditUserForm({
                            firstName: '',
                            lastName: '',
                            preferredDisplayName: '',
                            address: '',
                            phoneNumber: '',
                            email: '',
                            username: ''
                          });
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="btn-secondary bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Reset Password
                      </button>
                      <button
                        type="submit"
                        disabled={editUserLoading}
                        className="btn-primary"
                      >
                        {editUserLoading ? 'Updating...' : 'Update User Information'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Reset Modal */}
              {showResetPassword && selectedEditUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Reset Password for {selectedEditUser.firstName} {selectedEditUser.lastName}
                      </h3>
                      <button
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="resetNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password *
                        </label>
                        <input
                          id="resetNewPassword"
                          name="newPassword"
                          type="password"
                          required
                          value={resetPasswordForm.newPassword}
                          onChange={handleResetPasswordInputChange}
                          className="input"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label htmlFor="resetConfirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password *
                        </label>
                        <input
                          id="resetConfirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          value={resetPasswordForm.confirmPassword}
                          onChange={handleResetPasswordInputChange}
                          className="input"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-900">Password Requirements</h4>
                            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                              <li>• At least 8 characters long</li>
                              <li>• User will need to use this password to log in</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetPassword(false);
                            setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={resetPasswordLoading}
                          className="btn-primary bg-orange-600 hover:bg-orange-700"
                        >
                          {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


