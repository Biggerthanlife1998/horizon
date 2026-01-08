import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import { api } from '@/utils/api';
import { 
  TrendingUp,  
  ArrowUpRight, 
  ArrowDownLeft,
  CreditCard,
  PiggyBank,
  Loader2,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Account {
  id: string;
  type: string;
  name: string;
  balance: number;
  availableBalance: number;
  accountNumber: string;
  routingNumber: string;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  status: string;
  transactionDate: string;
  accountId: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts and recent transactions
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch accounts
        const accountsResponse = await api.get('/user/accounts');
        setAccounts(accountsResponse.data.accounts);
        
        // Fetch recent transactions
        const transactionsResponse = await api.get('/user/transactions/recent');
        setRecentTransactions(transactionsResponse.data.transactions);
        
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Table columns configuration
  const transactionColumns = [
    {
      key: 'description',
      label: 'Transaction',
      mobile: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getTransactionIcon(row.type)}
          </div>
          <div className="ml-3">
            <div className={`text-sm font-medium ${row.status === 'pending' ? 'text-gray-600 opacity-80' : 'text-gray-900'}`}>
              {value}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      mobile: true,
      render: (value: string) => (
        <span className={getTransactionBadge(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'accountId',
      label: 'Account',
      mobile: false, // Hide on mobile to save space
      render: (value: string) => (
        <span className="text-sm text-gray-500 capitalize">
          {value === 'checking' ? 'Checking' : 
           value === 'savings' ? 'Savings' : 
           value === 'credit' ? 'Credit Card' : value}
        </span>
      )
    },
    {
      key: 'transactionDate',
      label: 'Date',
      mobile: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      mobile: true,
      className: 'text-right',
      render: (value: number, row: any) => (
        <span className={`text-sm font-medium ${value > 0 ? 'text-success-600' : 'text-error-600'} ${row.status === 'pending' ? 'opacity-70' : ''}`}>
          {value > 0 ? '+' : ''}{formatUSD(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      mobile: true,
      render: (value: string) => (
        <span className={getStatusBadge(value)}>
          {value === 'pending' && <Clock className="w-3 h-3 mr-1 inline" />}
          {value === 'completed' && <CheckCircle className="w-3 h-3 mr-1 inline" />}
          {value === 'pending' ? 'Pending' : value === 'completed' ? 'Completed' : value === 'failed' ? 'Failed' : value}
        </span>
      )
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'salary':
        return <ArrowDownLeft className="w-5 h-5 text-success-600" />;
      case 'withdrawal':
      case 'payment':
      case 'grocery':
      case 'gas':
      case 'restaurant':
      case 'online':
      case 'atm':
      case 'fee':
        return <ArrowUpRight className="w-5 h-5 text-error-600" />;
      case 'transfer':
        return <TrendingUp className="w-5 h-5 text-primary-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'salary':
      case 'interest':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800';
      case 'withdrawal':
      case 'payment':
      case 'grocery':
      case 'gas':
      case 'restaurant':
      case 'online':
      case 'atm':
      case 'fee':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800';
      case 'transfer':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800';
      case 'failed':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800';
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with user info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
              <p className="text-gray-600 mt-2 text-lg">Here's what's happening with your accounts today.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user?.profilePicture && (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${user.profilePicture}`}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
              />
            )}
          </div>
        </div>
      </div>

      {/* Account balance hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {account.type === 'checking' ? (
                  <CreditCard className="w-8 h-8 text-primary-600" />
                ) : account.type === 'savings' ? (
                  <PiggyBank className="w-8 h-8 text-primary-600" />
                ) : (
                  <CreditCard className="w-8 h-8 text-orange-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {account.name}
                  </h3>
                  <p className="text-sm text-gray-600">****{account.accountNumber.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-900">
                  {formatUSD(account.balance)}
                </div>
                <div className="text-sm text-primary-700">
                  {account.type === 'checking' ? 'Available Balance' : 
                   account.type === 'savings' ? 'Total Balance' : 'Credit Limit'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Account Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                {account.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <div className="text-sm text-gray-500">
            Showing last {recentTransactions.length} transactions
          </div>
        </div>
        
        <DataTable
          data={recentTransactions}
          columns={transactionColumns}
          itemsPerPage={10}
        />
      </div>
    </div>
  );
}
