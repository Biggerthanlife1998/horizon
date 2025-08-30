import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import { api } from '@/utils/api';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import DataTable from '@/components/DataTable';
import { 
  CreditCard, 
  DollarSign,
  CheckCircle,
  Receipt,
  Zap,
  Wifi,
  Phone,
  Droplets,
  Shield,
  Tv
} from 'lucide-react';

interface PaymentForm {
  biller: string;
  amount: string;
  note: string;
}

interface Biller {
  id: string;
  name: string;
  category: string;
  description: string;
  accountNumber: string;
}

interface PaymentConfirmation {
  confirmationCode: string;
  billerName: string;
  billerId: string;
  amount: number;
  accountNumber: string;
  dateTime: string;
  note: string;
}

interface PaymentTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  status: string;
  transactionDate: string;
  createdAt: string;
  billerName: string;
  billerId: string;
  confirmationCode: string;
  note: string;
}

const BILLER_ICONS: { [key: string]: JSX.Element } = {
  electricity: <Zap className="w-4 h-4" />,
  internet: <Wifi className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  insurance: <Shield className="w-4 h-4" />,
  cable: <Tv className="w-4 h-4" />
};

export default function Payments() {
  const [form, setForm] = useState<PaymentForm>({
    biller: '',
    amount: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<PaymentConfirmation | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch billers and payment history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch billers
        const billersResponse = await api.get('/user/payments/billers');
        setBillers(billersResponse.data.billers);

        // Fetch payment history
        await fetchPaymentHistory();
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      }
    };

    fetchData();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/user/payments/history');
      setPaymentHistory(response.data.payments);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make real API call
      const response = await api.post('/user/payments', {
        billerId: form.biller,
        amount: parseFloat(form.amount),
        note: form.note
      });

      if (response.data.success) {
        // Use real receipt data from API
        const receipt = response.data.receipt;
        const confirmation: PaymentConfirmation = {
          confirmationCode: receipt.confirmationCode,
          billerName: receipt.billerName,
          billerId: receipt.billerId,
          amount: receipt.amount,
          accountNumber: receipt.accountNumber,
          dateTime: receipt.dateTime,
          note: receipt.note
        };

        setConfirmationData(confirmation);
        setShowConfirmation(true);
        
        // Refresh payment history
        await fetchPaymentHistory();
        
        // Reset form
        setForm({
          biller: '',
          amount: '',
          note: ''
        });
      }

    } catch (error: any) {
      console.error('Payment failed:', error);
      const errorMessage = error.response?.data?.message || 'Payment failed. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-success-100 text-success-800',
      pending: 'bg-warning-100 text-warning-800',
      failed: 'bg-error-100 text-error-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tableColumns = [
    {
      key: 'transactionDate',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => value
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (
        <span className="font-medium text-gray-900">
          {formatUSD(value)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bill Payments</h1>
        <p className="text-gray-600 mt-1">Pay your bills quickly and securely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div>
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Make a Payment</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Biller Selection */}
              <FormInput
                label="Select Biller"
                name="biller"
                type="select"
                value={form.biller}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose a biller...</option>
                {billers.map(biller => (
                  <option key={biller.id} value={biller.id}>
                    {biller.name}
                  </option>
                ))}
              </FormInput>

              {/* Amount */}
              <FormInput
                label="Payment Amount (USD)"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                icon={<DollarSign className="w-5 h-5" />}
                step="0.01"
                min="0.01"
              />

              {/* Note */}
              <FormInput
                label="Note (Optional)"
                name="note"
                type="textarea"
                value={form.note}
                onChange={handleInputChange}
                placeholder="Add a note for this payment (e.g., 'January electricity bill')"
              />

              {/* Submit Button */}
              <LoadingButton
                loading={loading}
                disabled={!form.biller || !form.amount}
                type="submit"
                loadingText="Processing Payment..."
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Bill
              </LoadingButton>
            </form>
          </div>
        </div>

        {/* Quick Billers */}
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Pay</h2>
            <div className="grid grid-cols-2 gap-4">
              {billers.map(biller => (
                <button
                  key={biller.id}
                  onClick={() => setForm(prev => ({ ...prev, biller: biller.id }))}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary-600">
                      {BILLER_ICONS[biller.id] || <CreditCard className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{biller.name}</p>
                      <p className="text-sm text-gray-500">{biller.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Receipt className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <DataTable
            data={paymentHistory}
            columns={tableColumns}
            itemsPerPage={10}
            searchable={true}
            searchPlaceholder="Search payments..."
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Payment Successful"
      >
        {confirmationData && (
          <>
            {/* Bank Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-primary-600">Navy Federal Credit Union</h3>
              <p className="text-sm text-gray-600">Bill Payment Confirmation</p>
            </div>

            {/* Confirmation Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Confirmation Code:</span>
                <span className="text-sm font-mono text-gray-900">{confirmationData.confirmationCode}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Biller:</span>
                <span className="text-sm text-gray-900">{confirmationData.billerName}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Account Number:</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                  {confirmationData.accountNumber}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="text-lg font-bold text-gray-900">{formatUSD(confirmationData.amount)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Payment Date:</span>
                <span className="text-sm text-gray-900">{confirmationData.dateTime}</span>
              </div>

              {confirmationData.note && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Note:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">{confirmationData.note}</span>
                </div>
              )}
            </div>

            {/* Important Information */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Payment Processed</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment has been successfully processed and will be reflected in your account immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-4">
                Please save this confirmation for your records. You can view the payment in your transaction history.
              </p>
              
              <LoadingButton
                loading={false}
                onClick={() => setShowConfirmation(false)}
              >
                Done
              </LoadingButton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}







