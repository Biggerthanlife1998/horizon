import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/DataTable';
import { api } from '@/utils/api';
import { 
  CreditCard, 
  PiggyBank, 
  Download, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2
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
  accountId: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  status: string;
  transactionDate: string;
}

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // Fetch accounts
        const accountsResponse = await api.get('/user/accounts');
        setAccounts(accountsResponse.data.accounts);
        
      } catch (error: any) {
        console.error('Failed to fetch accounts data:', error);
        setError(error.response?.data?.message || 'Failed to load accounts data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAccounts();
    }
  }, [user]);

  // Fetch transactions when account is selected
  useEffect(() => {
    const fetchAccountTransactions = async () => {
      if (!selectedAccount) {
        setTransactions([]);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch transactions for the selected account
        const transactionsResponse = await api.get(`/user/accounts/${selectedAccount.type}/transactions`, {
          params: {
            page: 1,
            limit: 100,
            ...(filters.startDate && { startDate: filters.startDate }),
            ...(filters.endDate && { endDate: filters.endDate }),
            ...(filters.type && { transactionType: filters.type })
          }
        });
        setTransactions(transactionsResponse.data.transactions);
        
      } catch (error: any) {
        console.error('Failed to fetch account transactions:', error);
        setError(error.response?.data?.message || 'Failed to load account transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountTransactions();
  }, [selectedAccount, filters, user]);

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
          <div className="text-red-600 text-lg font-medium mb-2">Error Loading Accounts</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const generatePDF = async () => {
    try {
      const response = await api.get('/user/statements');
      const statementData = response.data.statement;
      
      // This is a placeholder for PDF generation
      // You'll need to install and implement jsPDF or html2pdf
      console.log('Generating PDF statement:', statementData);
      alert('PDF statement generation would be implemented here with jsPDF or html2pdf');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF statement');
    }
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (selectedAccount) {
      filtered = filtered.filter(t => t.accountId === selectedAccount.id);
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.transactionDate) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.transactionDate) <= new Date(filters.endDate));
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
            <div className="text-sm font-medium text-gray-900">
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
      mobile: false,
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
      render: (value: number) => (
        <span className={`text-sm font-medium ${value > 0 ? 'text-success-600' : 'text-error-600'}`}>
          {value > 0 ? '+' : ''}{formatUSD(value)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-2">Manage your accounts and view transaction history.</p>
        </div>
        <button
          onClick={generatePDF}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Statement</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`card cursor-pointer transition-all duration-200 ${
              selectedAccount?.id === account.id
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : 'hover:shadow-lg hover:-translate-y-1'
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <div className="flex items-center justify-between mb-4">
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
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {account.type === 'credit' ? 'Credit Limit' : 'Balance'}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatUSD(account.balance)}
                </span>
              </div>
              
              {account.type !== 'credit' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-lg font-semibold text-primary-600">
                    {formatUSD(account.availableBalance)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                  {account.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      {selectedAccount && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Transaction History - {selectedAccount.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing transactions for {selectedAccount.name}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="input"
                  >
                    <option value="">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer</option>
                    <option value="payment">Payment</option>
                    <option value="salary">Salary</option>
                    <option value="grocery">Grocery</option>
                    <option value="gas">Gas</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="online">Online</option>
                    <option value="atm">ATM</option>
                    <option value="fee">Fee</option>
                    <option value="interest">Interest</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <DataTable
            data={filteredTransactions}
            columns={transactionColumns}
            itemsPerPage={10}
          />
        </div>
      )}

      {/* No Account Selected */}
      {!selectedAccount && (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
          <p className="text-gray-600">
            Click on an account card above to view its transaction history.
          </p>
        </div>
      )}
    </div>
  );
}
