import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { 
  CreditCard, 
  PiggyBank, 
  Download,
  Receipt,
  History,
  Calendar,
  Trash2,
  Clock,
  X,
  ArrowRight,
  Edit
} from 'lucide-react';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';

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

interface ReceiptData {
  confirmationCode: string;
  amount: number;
  fromAccount: string;
  fromAccountType: string;
  toName: string;
  toAccountNumber: string;
  toBankName?: string;
  swiftCode?: string;
  dateTime: string;
  note: string;
  transferSpeed: string;
  expectedCompletion: string;
  fee: number;
}

interface SavedRecipient {
  id: string;
  name: string;
  accountNumber: string;
  bankName?: string;
  category: 'personal' | 'business' | 'family' | 'other';
  isVerified: boolean;
  lastUsed: string;
  createdAt: string;
}

interface TransferSpeedOption {
  id: string;
  name: string;
  description: string;
  fee: number;
  limit: number;
  estimatedTime: string;
  available: boolean;
}

interface TransferHistoryTransaction {
  id: string;
  accountId: string;
  accountName: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  transactionDate: string;
  createdAt: string;
  accountBalance: number;
  transferSpeed?: string;
  recipientName?: string;
  recipientAccount?: string;
}

interface ScheduledTransfer {
  id: string;
  fromAccountId: string;
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankName?: string;
  amount: number;
  note?: string;
  kind: 'internal' | 'external' | 'international';
  swiftCode?: string;
  transferSpeed: 'instant' | 'next-day' | 'standard';
  scheduledDate: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string;
  lastExecuted?: string;
  nextExecution?: string;
  executionCount: number;
  maxExecutions?: number;
  confirmationCode: string;
  createdAt: string;
}

export default function Transfer() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    fromAccount: '',
    recipientName: '',
    recipientAccountNumber: '',
    recipientBankName: '',
    amount: '',
    note: '',
    kind: 'internal' as 'internal' | 'external' | 'international',
    swiftCode: '',
    transferPin: '',
    transferSpeed: 'next-day', // Default to next business day
    saveRecipient: false // Option to save recipient
  });
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  
  // Enhanced security state
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const LARGE_TRANSFER_THRESHOLD = 1000; // $1000 threshold for 2FA
  
  // Scheduled transfer confirmation state
  const [showScheduledConfirmation, setShowScheduledConfirmation] = useState(false);
  const [scheduledConfirmationData, setScheduledConfirmationData] = useState<any>(null);
  
  // Transfer history state
  const [showHistory, setShowHistory] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    accountType: '',
    transactionType: '',
    transferSpeed: '',
    status: ''
  });

  // Transfer speed options
  const transferSpeedOptions: TransferSpeedOption[] = [
    {
      id: 'instant',
      name: 'Instant Transfer',
      description: 'Completed in minutes',
      fee: 0,
      limit: 2500,
      estimatedTime: 'Completed in minutes',
      available: true
    },
    {
      id: 'next-day',
      name: 'Next Business Day',
      description: 'Completed by end of next business day',
      fee: 0,
      limit: 10000,
      estimatedTime: 'Completed by end of next business day',
      available: true
    },
    {
      id: 'standard',
      name: 'Standard Transfer',
      description: 'Completed in 2-3 business days',
      fee: 0,
      limit: 50000,
      estimatedTime: 'Completed in 2-3 business days',
      available: true
    }
  ];

  // Saved recipients state
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [showEditRecipient, setShowEditRecipient] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<SavedRecipient | null>(null);
  const [editRecipientForm, setEditRecipientForm] = useState({
    name: '',
    accountNumber: '',
    bankName: '',
    category: 'other' as 'personal' | 'business' | 'family' | 'other'
  });

  // Scheduled transfers state
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'scheduled' | 'history' | 'analytics'>('transfer');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    totalTransfers: 0,
    totalAmount: 0,
    averageTransfer: 0,
    monthlyTrends: [] as { month: string; count: number; amount: number }[],
    frequentRecipients: [] as { name: string; count: number; totalAmount: number }[],
    transferTypes: [] as { type: string; count: number; amount: number }[],
    spendingByCategory: [] as { category: string; count: number; amount: number }[]
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [scheduledForm, setScheduledForm] = useState({
    fromAccount: '',
    recipientName: '',
    recipientAccountNumber: '',
    recipientBankName: '',
    amount: '',
    note: '',
    kind: 'internal' as 'internal' | 'external' | 'international',
    swiftCode: '',
    transferSpeed: 'next-day' as 'instant' | 'next-day' | 'standard',
    scheduledDate: '',
    frequency: 'once' as 'once' | 'weekly' | 'monthly' | 'yearly',
    endDate: '',
    maxExecutions: ''
  });

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/user/accounts');
        setAccounts(response.data.accounts);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };

    if (user) {
      fetchAccounts();
    }
  }, [user]);

  // Fetch saved recipients
  const fetchSavedRecipients = async () => {
    try {
      setRecipientsLoading(true);
      const response = await api.get('/user/recipients');
      setSavedRecipients(response.data.recipients);
    } catch (error) {
      console.error('Failed to fetch saved recipients:', error);
    } finally {
      setRecipientsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedRecipients();
    }
  }, [user]);

  // Fetch scheduled transfers
  const fetchScheduledTransfers = async () => {
    try {
      setScheduledLoading(true);
      const response = await api.get('/user/scheduled-transfers');
      setScheduledTransfers(response.data.scheduledTransfers);
    } catch (error) {
      console.error('Failed to fetch scheduled transfers:', error);
    } finally {
      setScheduledLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'scheduled') {
      fetchScheduledTransfers();
    }
  }, [user, activeTab]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await api.get('/user/transfer/history?limit=1000');
      const transfers = response.data.transactions;
      
      // Calculate analytics
      const totalTransfers = transfers.length;
      const totalAmount = transfers.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      const averageTransfer = totalTransfers > 0 ? totalAmount / totalTransfers : 0;
      
      // Monthly trends (last 12 months)
      const monthlyData: { [key: string]: { count: number; amount: number } } = {};
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = { count: 0, amount: 0 };
      }
      
      transfers.forEach((transfer: any) => {
        const month = new Date(transfer.transactionDate).toISOString().slice(0, 7);
        if (monthlyData[month]) {
          monthlyData[month].count++;
          monthlyData[month].amount += Math.abs(transfer.amount);
        }
      });
      
      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      // Frequent recipients
      const recipientData: { [key: string]: { count: number; totalAmount: number } } = {};
      transfers.forEach((transfer: any) => {
        if (transfer.description && transfer.description.includes('Transfer to')) {
          const recipientName = transfer.description.replace('Transfer to ', '').split(' (')[0];
          if (!recipientData[recipientName]) {
            recipientData[recipientName] = { count: 0, totalAmount: 0 };
          }
          recipientData[recipientName].count++;
          recipientData[recipientName].totalAmount += Math.abs(transfer.amount);
        }
      });
      
      const frequentRecipients = Object.entries(recipientData)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Transfer types
      const typeData: { [key: string]: { count: number; amount: number } } = {};
      transfers.forEach((transfer: any) => {
        const type = transfer.type || 'transfer';
        if (!typeData[type]) {
          typeData[type] = { count: 0, amount: 0 };
        }
        typeData[type].count++;
        typeData[type].amount += Math.abs(transfer.amount);
      });
      
      const transferTypes = Object.entries(typeData)
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.count - a.count);
      
      // Spending by category (from saved recipients)
      const categoryData: { [key: string]: { count: number; amount: number } } = {};
      transfers.forEach((transfer: any) => {
        if (transfer.description && transfer.description.includes('Transfer to')) {
          // Try to match with saved recipients
          const savedRecipient = savedRecipients.find(r => 
            transfer.description.includes(r.name)
          );
          const category = savedRecipient?.category || 'other';
          if (!categoryData[category]) {
            categoryData[category] = { count: 0, amount: 0 };
          }
          categoryData[category].count++;
          categoryData[category].amount += Math.abs(transfer.amount);
        }
      });
      
      const spendingByCategory = Object.entries(categoryData)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);
      
      setAnalyticsData({
        totalTransfers,
        totalAmount,
        averageTransfer,
        monthlyTrends,
        frequentRecipients,
        transferTypes,
        spendingByCategory
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [user, activeTab, savedRecipients]);

  // Delete saved recipient
  const deleteSavedRecipient = async (recipientId: string) => {
    if (!confirm('Are you sure you want to delete this recipient? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/user/recipients/${recipientId}`);
      // Refresh the recipients list
      fetchSavedRecipients();
    } catch (error) {
      console.error('Failed to delete recipient:', error);
      alert('Failed to delete recipient. Please try again.');
    }
  };

  // Edit saved recipient
  const editSavedRecipient = (recipient: SavedRecipient) => {
    setEditingRecipient(recipient);
    setEditRecipientForm({
      name: recipient.name,
      accountNumber: recipient.accountNumber,
      bankName: recipient.bankName || '',
      category: recipient.category
    });
    setShowEditRecipient(true);
  };

  // Handle edit recipient form input changes
  const handleEditRecipientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditRecipientForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit recipient form submission
  const handleEditRecipientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipient) return;

    try {
      await api.put(`/user/recipients/${editingRecipient.id}`, editRecipientForm);
      setShowEditRecipient(false);
      setEditingRecipient(null);
      fetchSavedRecipients();
    } catch (error: any) {
      console.error('Failed to update recipient:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update recipient. Please try again.';
      alert(errorMessage);
    }
  };

  // Handle scheduled transfer form input changes
  const handleScheduledInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setScheduledForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle scheduled transfer form submission
  const handleScheduledSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/user/scheduled-transfers', {
        fromAccountId: scheduledForm.fromAccount,
        recipientName: scheduledForm.recipientName,
        recipientAccountNumber: scheduledForm.recipientAccountNumber,
        recipientBankName: scheduledForm.recipientBankName,
        amount: parseFloat(scheduledForm.amount),
        note: scheduledForm.note,
        kind: scheduledForm.kind,
        swiftCode: scheduledForm.kind === 'international' ? scheduledForm.swiftCode : '',
        transferSpeed: scheduledForm.transferSpeed,
        scheduledDate: scheduledForm.scheduledDate,
        frequency: scheduledForm.frequency,
        endDate: scheduledForm.endDate || undefined,
        maxExecutions: scheduledForm.maxExecutions ? parseInt(scheduledForm.maxExecutions) : undefined
      });

      if (response.data.success) {
        // Set confirmation data
        setScheduledConfirmationData({
          confirmationCode: response.data.scheduledTransfer.confirmationCode,
          recipientName: response.data.scheduledTransfer.recipientName,
          amount: response.data.scheduledTransfer.amount,
          scheduledDate: response.data.scheduledTransfer.scheduledDate,
          frequency: response.data.scheduledTransfer.frequency,
          transferSpeed: response.data.scheduledTransfer.transferSpeed,
          note: response.data.scheduledTransfer.note
        });
        
        // Show confirmation modal
        setShowScheduledConfirmation(true);
        
        // Reset form
        setScheduledForm({
          fromAccount: '',
          recipientName: '',
          recipientAccountNumber: '',
          recipientBankName: '',
          amount: '',
          note: '',
          kind: 'internal',
          swiftCode: '',
          transferSpeed: 'next-day',
          scheduledDate: '',
          frequency: 'once',
          endDate: '',
          maxExecutions: ''
        });
        // Refresh scheduled transfers list
        fetchScheduledTransfers();
      }
    } catch (error: any) {
      console.error('Scheduled transfer failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create scheduled transfer. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancel scheduled transfer
  const cancelScheduledTransfer = async (transferId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled transfer?')) {
      return;
    }

    try {
      await api.delete(`/user/scheduled-transfers/${transferId}`);
      fetchScheduledTransfers();
    } catch (error) {
      console.error('Failed to cancel scheduled transfer:', error);
      alert('Failed to cancel scheduled transfer. Please try again.');
    }
  };

  // Fetch transfer history
  const fetchTransferHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/user/transfer/history', {
        params: {
          page: 1,
          limit: 50,
          ...(historyFilters.startDate && { startDate: historyFilters.startDate }),
          ...(historyFilters.endDate && { endDate: historyFilters.endDate }),
          ...(historyFilters.accountType && { accountType: historyFilters.accountType }),
          ...(historyFilters.transactionType && { transactionType: historyFilters.transactionType })
        }
      });
      setTransferHistory(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transfer history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Generate and send 2FA code (simulated)
  const generateTwoFactorCode = () => {
    // In a real app, this would send an SMS or email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('2FA Code (for demo):', code);
    return code;
  };

  // Verify 2FA code (simulated)
  const verifyTwoFactorCode = async (code: string) => {
    // In a real app, this would verify against the sent code
    // For demo purposes, we'll accept any 6-digit code
    return code.length === 6 && /^\d+$/.test(code);
  };

  // Process the actual transfer
  const processTransfer = async (transferData: any) => {
    setLoading(true);

    try {
      // Validate account type for transfers (credit cards are already filtered out in the dropdown)
      const selectedAccount = accounts.find(acc => acc.id === transferData.fromAccountId);
      if (selectedAccount?.type === 'credit') {
        alert('Cannot transfer from credit card accounts. Please select a checking or savings account.');
        setLoading(false);
        return;
      }

      // Make real API call
      const response = await api.post('/user/transfer', transferData);

      if (response.data.success) {
        // Use real receipt data from API
        const selectedSpeed = transferSpeedOptions.find(opt => opt.id === transferData.transferSpeed);
        const receipt: ReceiptData = {
          confirmationCode: response.data.receipt.confirmationCode,
          amount: response.data.receipt.amount,
          fromAccount: response.data.receipt.fromAccount,
          fromAccountType: response.data.receipt.fromAccountType,
          toName: response.data.receipt.toName,
          toAccountNumber: response.data.receipt.toAccountNumber,
          toBankName: response.data.receipt.toBankName,
          swiftCode: response.data.receipt.swiftCode,
          dateTime: response.data.receipt.dateTime,
          note: response.data.receipt.note,
          transferSpeed: selectedSpeed?.name || 'Standard Transfer',
          expectedCompletion: selectedSpeed?.estimatedTime || '2-3 business days',
          fee: selectedSpeed?.fee || 0
        };

        setReceiptData(receipt);
        setShowReceipt(true);
        
        // Reset form
        setForm({
          fromAccount: '',
          recipientName: '',
          recipientAccountNumber: '',
          recipientBankName: '',
          amount: '',
          note: '',
          kind: 'internal',
          swiftCode: '',
          transferPin: '',
          transferSpeed: 'next-day',
          saveRecipient: false
        });

        // Refresh accounts to show updated balances
        const accountsResponse = await api.get('/user/accounts');
        setAccounts(accountsResponse.data.accounts);

        // Refresh saved recipients if a recipient was saved
        if (transferData.saveRecipient) {
          fetchSavedRecipients();
        }
      }

    } catch (error: any) {
      console.error('Transfer failed:', error);
      const errorMessage = error.response?.data?.message || 'Transfer failed. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const transferAmount = parseFloat(form.amount);
    
    // Check if this is a large transfer requiring 2FA
    if (transferAmount >= LARGE_TRANSFER_THRESHOLD) {
      // Store the transfer data for later processing
      setPendingTransfer({
        fromAccountId: form.fromAccount,
        recipientName: form.recipientName,
        recipientAccountNumber: form.recipientAccountNumber,
        recipientBankName: form.recipientBankName,
        amount: transferAmount,
        note: form.note,
        kind: form.kind,
        swiftCode: form.kind === 'international' ? form.swiftCode : '',
        transferSpeed: form.transferSpeed,
        transferPin: form.transferPin,
        saveRecipient: form.saveRecipient
      });
      
      // Generate and send 2FA code
      generateTwoFactorCode();
      setShowTwoFactorModal(true);
      return;
    }

    // Process regular transfer
    await processTransfer({
      fromAccountId: form.fromAccount,
      recipientName: form.recipientName,
      recipientAccountNumber: form.recipientAccountNumber,
      recipientBankName: form.recipientBankName,
      amount: transferAmount,
      note: form.note,
      kind: form.kind,
      swiftCode: form.kind === 'international' ? form.swiftCode : '',
      transferSpeed: form.transferSpeed,
      transferPin: form.transferPin,
      saveRecipient: form.saveRecipient
    });
  };

  // Handle 2FA verification
  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTransfer) return;

    setTwoFactorLoading(true);

    try {
      const isValid = await verifyTwoFactorCode(twoFactorCode);
      
      if (isValid) {
        // Close 2FA modal
        setShowTwoFactorModal(false);
        setTwoFactorCode('');
        
        // Process the pending transfer
        await processTransfer(pendingTransfer);
        
        // Clear pending transfer
        setPendingTransfer(null);
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptData) return;
    
    try {
      // This is a placeholder for PDF generation
      // You'll need to install and implement jsPDF or html2pdf
      console.log('Downloading receipt:', receiptData);
      alert('PDF receipt download would be implemented here with jsPDF or html2pdf');
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case 'checking':
        return <CreditCard className="w-5 h-5 text-primary-600" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-primary-600" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-orange-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAccountBalance = (account: Account) => {
    if (account.type === 'credit') {
      return `Credit Limit: ${formatUSD(account.balance)}`;
    }
    return `Available: ${formatUSD(account.balance)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Money Transfer</h1>
        <p className="text-gray-600 mt-2">Send money to other accounts or external recipients.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transfer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transfer'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArrowRight className="w-4 h-4 inline mr-2" />
            Send Money
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scheduled'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Scheduled Transfers
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Transfer History
          </button>
          {/* Analytics tab commented out for now */}
          {/* <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Analytics
          </button> */}
        </nav>
      </div>

      {/* Transfer Form */}
      {activeTab === 'transfer' && (
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Account *
            </label>
            <select
              name="fromAccount"
              value={form.fromAccount}
              onChange={handleInputChange}
              required
              className="input"
            >
              <option value="">Select an account</option>
              {accounts.filter(account => account.type !== 'credit').map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {getAccountBalance(account)}
                </option>
              ))}
            </select>
          </div>

          {/* Saved Recipients */}
          {recipientsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading recipients...</span>
            </div>
          ) : savedRecipients.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Select from Saved Recipients
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {savedRecipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          recipientName: recipient.name,
                          recipientAccountNumber: recipient.accountNumber.replace('****', ''),
                          recipientBankName: recipient.bankName || ''
                        }));
                      }}
                      className="flex-1 text-left"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{recipient.name}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            recipient.category === 'personal' ? 'bg-blue-100 text-blue-700' :
                            recipient.category === 'family' ? 'bg-green-100 text-green-700' :
                            recipient.category === 'business' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {recipient.category}
                          </span>
                          {recipient.isVerified && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{recipient.accountNumber}</p>
                        {recipient.bankName && (
                          <p className="text-xs text-gray-500">{recipient.bankName}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Last used: {new Date(recipient.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          editSavedRecipient(recipient);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit recipient"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedRecipient(recipient.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete recipient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Recipient Name */}
          <FormInput
            label="Recipient Name *"
            name="recipientName"
            value={form.recipientName}
            onChange={handleInputChange}
            placeholder="Enter recipient's full name"
            required
          />

          {/* Recipient Account Number */}
          <FormInput
            label="Recipient Account Number *"
            name="recipientAccountNumber"
            value={form.recipientAccountNumber}
            onChange={handleInputChange}
            placeholder="Enter recipient's account number"
            required
          />

          {/* Recipient Bank Name */}
          <FormInput
            label="Recipient Bank Name (Optional)"
            name="recipientBankName"
            value={form.recipientBankName}
            onChange={handleInputChange}
            placeholder="Enter recipient's bank name (e.g., Chase, Bank of America)"
          />

          {/* Amount */}
          <div>
            <FormInput
              label="Amount *"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
            {parseFloat(form.amount) >= LARGE_TRANSFER_THRESHOLD && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-yellow-800">
                    Large transfers (${LARGE_TRANSFER_THRESHOLD}+) require two-factor authentication for security.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transfer Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transfer Speed *
            </label>
            <div className="space-y-3">
              {transferSpeedOptions.map((option) => {
                const isSelected = form.transferSpeed === option.id;
                const isOverLimit = parseFloat(form.amount) > option.limit;
                const isDisabled = !option.available || isOverLimit;
                
                return (
                  <div
                    key={option.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => !isDisabled && handleInputChange({ target: { name: 'transferSpeed', value: option.id } } as any)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{option.name}</span>
                            {option.fee === 0 && (
                              <span className="px-2 py-1 text-xs font-medium text-success-700 bg-success-100 rounded-full">
                                No Fee
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                          <p className="text-xs text-gray-500">Limit: {formatUSD(option.limit)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {option.fee === 0 ? 'Free' : formatUSD(option.fee)}
                        </div>
                        {isOverLimit && (
                          <div className="text-xs text-error-600 mt-1">
                            Amount exceeds limit
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {form.transferSpeed && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700">
                    {transferSpeedOptions.find(opt => opt.id === form.transferSpeed)?.estimatedTime}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <FormInput
            label="Note (Optional)"
            name="note"
            value={form.note}
            onChange={handleInputChange}
            placeholder="Add a note for this transfer"
            type="textarea"
          />

          {/* Save Recipient Option */}
          <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="saveRecipient"
              name="saveRecipient"
              checked={form.saveRecipient}
              onChange={(e) => setForm(prev => ({ ...prev, saveRecipient: e.target.checked }))}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="saveRecipient" className="text-sm font-medium text-blue-900">
              Save this recipient for future transfers
            </label>
          </div>

          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Type *
            </label>
            <select
              name="kind"
              value={form.kind}
              onChange={handleInputChange}
              required
              className="input"
            >
              <option value="internal">Internal Transfer (Same Bank)</option>
              <option value="external">External Transfer (Other Banks)</option>
              <option value="international">International Transfer (SWIFT)</option>
            </select>
          </div>

          {/* SWIFT Code (International Only) */}
          {form.kind === 'international' && (
            <FormInput
              label="SWIFT Code *"
              name="swiftCode"
              value={form.swiftCode}
              onChange={handleInputChange}
              placeholder="Enter SWIFT/BIC code"
              required
            />
          )}

          {/* Transfer PIN */}
          <FormInput
            label="Transfer PIN *"
            name="transferPin"
            type="password"
            value={form.transferPin}
            onChange={handleInputChange}
            placeholder="Enter your 4-digit transfer PIN"
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            loading={loading}
            className="w-full"
          >
            {loading ? 'Processing Transfer...' : 'Send Money'}
          </LoadingButton>
        </form>
      </div>
      )}

      {/* Scheduled Transfers Section */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {/* Create Scheduled Transfer Form */}
          <div className="card max-w-2xl">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Schedule a Transfer</h2>
            </div>
            
            <form onSubmit={handleScheduledSubmit} className="space-y-6">
              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account *
                </label>
                <select
                  name="fromAccount"
                  value={scheduledForm.fromAccount}
                  onChange={handleScheduledInputChange}
                  required
                  className="input"
                >
                  <option value="">Select an account</option>
                  {accounts.filter(account => account.type !== 'credit').map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {getAccountBalance(account)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Recipient Name *"
                  name="recipientName"
                  value={scheduledForm.recipientName}
                  onChange={handleScheduledInputChange}
                  placeholder="Enter recipient's full name"
                  required
                />
                <FormInput
                  label="Recipient Account Number *"
                  name="recipientAccountNumber"
                  value={scheduledForm.recipientAccountNumber}
                  onChange={handleScheduledInputChange}
                  placeholder="Enter recipient's account number"
                  required
                />
              </div>

              <FormInput
                label="Recipient Bank Name (Optional)"
                name="recipientBankName"
                value={scheduledForm.recipientBankName}
                onChange={handleScheduledInputChange}
                placeholder="Enter recipient's bank name"
              />

              {/* Amount and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Amount *"
                  name="amount"
                  type="number"
                  value={scheduledForm.amount}
                  onChange={handleScheduledInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
                <FormInput
                  label="Scheduled Date *"
                  name="scheduledDate"
                  type="datetime-local"
                  value={scheduledForm.scheduledDate}
                  onChange={handleScheduledInputChange}
                  required
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  name="frequency"
                  value={scheduledForm.frequency}
                  onChange={handleScheduledInputChange}
                  required
                  className="input"
                >
                  <option value="once">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* End Date and Max Executions (for recurring) */}
              {scheduledForm.frequency !== 'once' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="End Date (Optional)"
                    name="endDate"
                    type="date"
                    value={scheduledForm.endDate}
                    onChange={handleScheduledInputChange}
                  />
                  <FormInput
                    label="Max Executions (Optional)"
                    name="maxExecutions"
                    type="number"
                    value={scheduledForm.maxExecutions}
                    onChange={handleScheduledInputChange}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              )}

              {/* Transfer Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Transfer Speed *
                </label>
                <div className="space-y-3">
                  {transferSpeedOptions.map((option) => {
                    const isSelected = scheduledForm.transferSpeed === option.id;
                    const isOverLimit = parseFloat(scheduledForm.amount) > option.limit;
                    const isDisabled = !option.available || isOverLimit;
                    
                    return (
                      <div
                        key={option.id}
                        className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                        onClick={() => !isDisabled && handleScheduledInputChange({ target: { name: 'transferSpeed', value: option.id } } as any)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{option.name}</span>
                                {option.fee === 0 && (
                                  <span className="px-2 py-1 text-xs font-medium text-success-700 bg-success-100 rounded-full">
                                    No Fee
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              <p className="text-xs text-gray-500">Limit: {formatUSD(option.limit)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {option.fee === 0 ? 'Free' : formatUSD(option.fee)}
                            </div>
                            {isOverLimit && (
                              <div className="text-xs text-error-600 mt-1">
                                Amount exceeds limit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <FormInput
                label="Note (Optional)"
                name="note"
                value={scheduledForm.note}
                onChange={handleScheduledInputChange}
                placeholder="Add a note for this scheduled transfer"
                type="textarea"
              />

              <LoadingButton
                type="submit"
                loading={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creating Scheduled Transfer...' : 'Schedule Transfer'}
              </LoadingButton>
            </form>
          </div>

          {/* Scheduled Transfers List */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Scheduled Transfers</h2>
              </div>
            </div>

            {scheduledLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : scheduledTransfers.length > 0 ? (
              <DataTable
                data={scheduledTransfers}
                columns={[
                  {
                    key: 'recipientName',
                    label: 'Recipient',
                    mobile: true,
                    render: (value: string, row: ScheduledTransfer) => (
                      <div>
                        <div className="font-medium text-gray-900">{value}</div>
                        <div className="text-sm text-gray-500">{row.recipientAccountNumber}</div>
                        {row.recipientBankName && (
                          <div className="text-xs text-gray-400">{row.recipientBankName}</div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    mobile: true,
                    className: 'text-right',
                    render: (value: number) => (
                      <span className="text-sm font-medium text-gray-900">
                        {formatUSD(value)}
                      </span>
                    )
                  },
                  {
                    key: 'scheduledDate',
                    label: 'Scheduled Date',
                    mobile: true,
                    render: (value: string) => (
                      <span className="text-sm text-gray-600">
                        {new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )
                  },
                  {
                    key: 'frequency',
                    label: 'Frequency',
                    mobile: false,
                    render: (value: string) => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    mobile: true,
                    render: (value: string) => {
                      const statusConfig = {
                        scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
                        processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
                        completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
                        failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
                        cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
                      };
                      const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.scheduled;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    mobile: false,
                    render: (_: any, row: ScheduledTransfer) => (
                      <div className="flex space-x-2">
                        {row.status === 'scheduled' && (
                          <button
                            onClick={() => cancelScheduledTransfer(row.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Cancel transfer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  }
                ]}
                itemsPerPage={10}
              />
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Transfers</h3>
                <p className="text-gray-600">You haven't scheduled any transfers yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer History Section */}
      {activeTab === 'history' && (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Transfer History</h2>
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                fetchTransferHistory();
              }
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>{showHistory ? 'Hide History' : 'View All Transactions'}</span>
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <FormInput
                name="startDate"
                type="date"
                label="Start Date"
                value={historyFilters.startDate}
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                icon={<Calendar className="w-4 h-4" />}
              />
              <FormInput
                name="endDate"
                type="date"
                label="End Date"
                value={historyFilters.endDate}
                onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                icon={<Calendar className="w-4 h-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  name="accountType"
                  value={historyFilters.accountType}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, accountType: e.target.value }))}
                  className="input"
                >
                  <option value="">All Accounts</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                <select
                  name="transactionType"
                  value={historyFilters.transactionType}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="transfer">Transfer</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="payment">Payment</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
            </div>

            {/* Additional Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Speed</label>
                <select
                  name="transferSpeed"
                  value={historyFilters.transferSpeed}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, transferSpeed: e.target.value }))}
                  className="input"
                >
                  <option value="">All Speeds</option>
                  <option value="instant">Instant Transfer</option>
                  <option value="next-day">Next Business Day</option>
                  <option value="standard">Standard Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex justify-end">
              <LoadingButton
                onClick={fetchTransferHistory}
                loading={historyLoading}
                className="btn-primary"
              >
                Apply Filters
              </LoadingButton>
            </div>

            {/* Transfer History Table */}
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <DataTable
                data={transferHistory}
                columns={[
                  {
                    key: 'description',
                    label: 'Description',
                    mobile: true,
                    render: (value: string, row: any) => (
                      <div className="flex items-center space-x-3">
                        {getAccountIcon(row.accountId)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{value}</div>
                          <div className="text-xs text-gray-500">{row.accountName}</div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'type',
                    label: 'Type',
                    mobile: true,
                    render: (value: string) => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    )
                  },
                  {
                    key: 'transactionDate',
                    label: 'Date',
                    mobile: true,
                    render: (value: string) => (
                      <span className="text-sm text-gray-500">
                        {new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
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
                  },
                  {
                    key: 'transferSpeed',
                    label: 'Speed',
                    mobile: false,
                    render: (value: string) => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {value || 'Standard'}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    mobile: true,
                    render: (value: string) => {
                      const statusConfig = {
                        completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
                        processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
                        pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
                        failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
                      };
                      const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.completed;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      );
                    }
                  }
                ]}
                itemsPerPage={10}
              />
            )}
          </div>
        )}
      </div>
      )}

      {/* Analytics Section */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.totalTransfers}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUSD(analyticsData.totalAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Transfer</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUSD(analyticsData.averageTransfer)}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <History className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Most Frequent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.frequentRecipients.length > 0 ? analyticsData.frequentRecipients[0].count : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Transfer Trends</h3>
                {analyticsData.monthlyTrends.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.monthlyTrends.slice(-6).map((trend) => (
                      <div key={trend.month} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{trend.count} transfers</span>
                          <span className="text-sm font-medium text-gray-900">{formatUSD(trend.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No transfer data available</p>
                )}
              </div>

              {/* Frequent Recipients */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Frequent Recipients</h3>
                {analyticsData.frequentRecipients.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.frequentRecipients.slice(0, 5).map((recipient, index) => (
                      <div key={recipient.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{recipient.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{recipient.count} times</span>
                          <span className="text-sm font-medium text-gray-900">{formatUSD(recipient.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recipient data available</p>
                )}
              </div>

              {/* Transfer Types */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Types</h3>
                {analyticsData.transferTypes.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.transferTypes.map((type) => (
                      <div key={type.type} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">{type.type}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{type.count} transfers</span>
                          <span className="text-sm font-medium text-gray-900">{formatUSD(type.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No transfer type data available</p>
                )}
              </div>

              {/* Spending by Category */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                {analyticsData.spendingByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.spendingByCategory.map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 capitalize">{category.category}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{category.count} transfers</span>
                          <span className="text-sm font-medium text-gray-900">{formatUSD(category.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No category data available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      <Modal
        isOpen={showTwoFactorModal}
        onClose={() => {
          setShowTwoFactorModal(false);
          setPendingTransfer(null);
          setTwoFactorCode('');
        }}
        title="Two-Factor Authentication Required"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Large Transfer Detected</h3>
            <p className="text-sm text-gray-600 mb-4">
              For security purposes, transfers of ${LARGE_TRANSFER_THRESHOLD} or more require two-factor authentication.
            </p>
            <p className="text-sm text-gray-600">
              A verification code has been sent to your registered phone number.
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code *
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="[0-9]{6}"
                className="input text-center text-lg tracking-widest"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Demo: Enter any 6-digit number
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTwoFactorModal(false);
                  setPendingTransfer(null);
                  setTwoFactorCode('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {twoFactorLoading ? 'Verifying...' : 'Verify & Transfer'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Scheduled Transfer Confirmation Modal */}
      <Modal
        isOpen={showScheduledConfirmation}
        onClose={() => setShowScheduledConfirmation(false)}
        title="Scheduled Transfer Confirmed"
      >
        {scheduledConfirmationData && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Transfer Scheduled Successfully!</h3>
              <p className="text-sm text-gray-600">
                Your transfer has been scheduled and will be processed automatically.
              </p>
            </div>

            {/* Transfer Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Confirmation Code:</span>
                <span className="text-sm text-gray-900 font-mono">{scheduledConfirmationData.confirmationCode}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Recipient:</span>
                <span className="text-sm text-gray-900">{scheduledConfirmationData.recipientName}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="text-sm font-medium text-gray-900">{formatUSD(scheduledConfirmationData.amount)}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Scheduled Date:</span>
                <span className="text-sm text-gray-900">
                  {new Date(scheduledConfirmationData.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Frequency:</span>
                <span className="text-sm text-gray-900 capitalize">{scheduledConfirmationData.frequency}</span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Transfer Speed:</span>
                <span className="text-sm text-gray-900">
                  {transferSpeedOptions.find(opt => opt.id === scheduledConfirmationData.transferSpeed)?.name || 'Standard Transfer'}
                </span>
              </div>

              {scheduledConfirmationData.note && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Note:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">
                    {scheduledConfirmationData.note}
                  </span>
                </div>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Important Information</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• The transfer will be processed automatically on the scheduled date</li>
                    <li>• You can cancel or modify the transfer before it's processed</li>
                    <li>• You'll receive a notification when the transfer is completed</li>
                    <li>• Keep your confirmation code for reference</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowScheduledConfirmation(false)}
                className="btn-primary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Recipient Modal */}
      <Modal
        isOpen={showEditRecipient}
        onClose={() => {
          setShowEditRecipient(false);
          setEditingRecipient(null);
        }}
        title="Edit Recipient"
      >
        {editingRecipient && (
          <form onSubmit={handleEditRecipientSubmit} className="space-y-6">
            <FormInput
              label="Recipient Name *"
              name="name"
              value={editRecipientForm.name}
              onChange={handleEditRecipientInputChange}
              placeholder="Enter recipient's full name"
              required
            />

            <FormInput
              label="Account Number *"
              name="accountNumber"
              value={editRecipientForm.accountNumber}
              onChange={handleEditRecipientInputChange}
              placeholder="Enter recipient's account number"
              required
            />

            <FormInput
              label="Bank Name (Optional)"
              name="bankName"
              value={editRecipientForm.bankName}
              onChange={handleEditRecipientInputChange}
              placeholder="Enter recipient's bank name"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={editRecipientForm.category}
                onChange={handleEditRecipientInputChange}
                required
                className="input"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditRecipient(false);
                  setEditingRecipient(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                Update Recipient
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        title="Transfer Receipt"
      >
        {receiptData && (
          <div className="space-y-6">
            {/* Receipt Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <Receipt className="w-12 h-12 text-primary-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">Transfer Successful</h3>
              <p className="text-sm text-gray-600">Your money has been sent successfully</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Confirmation Code:</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {receiptData.confirmationCode}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatUSD(receiptData.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Transfer Speed:</span>
                <span className="text-sm text-gray-900">{receiptData.transferSpeed}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Expected Completion:</span>
                <span className="text-sm text-gray-900">{receiptData.expectedCompletion}</span>
              </div>

              {receiptData.fee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Transfer Fee:</span>
                  <span className="text-sm text-gray-900">{formatUSD(receiptData.fee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">From Account:</span>
                <span className="text-sm text-gray-900">
                  ****{receiptData.fromAccount.slice(-4)} ({receiptData.fromAccountType})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">To:</span>
                <span className="text-sm text-gray-900">{receiptData.toName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Account Number:</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {receiptData.toAccountNumber}
                </span>
              </div>

              {receiptData.toBankName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Bank Name:</span>
                  <span className="text-sm text-gray-900">{receiptData.toBankName}</span>
                </div>
              )}

              {receiptData.swiftCode && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">SWIFT Code:</span>
                  <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {receiptData.swiftCode}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                <span className="text-sm text-gray-900">{receiptData.dateTime}</span>
              </div>

              {receiptData.note && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Note:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">
                    {receiptData.note}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleDownloadReceipt}
                className="btn-secondary flex-1 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Receipt (PDF)</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="btn-primary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}





