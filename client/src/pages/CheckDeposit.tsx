import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import { generateConfirmationCode, formatDateTime, getExpectedAvailability } from '@/utils/constants';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import CameraCapture from '@/components/CameraCapture';
import DataTable from '@/components/DataTable';
import { 
  Camera, 
  DollarSign,
  CheckCircle,
  Clock,
  History,
  FileText,
  Calendar,
  XCircle,
  Image,
  Send
} from 'lucide-react';

interface CheckDepositForm {
  checkImage: string | null;
  amount: string;
  note: string;
}

interface DepositConfirmation {
  confirmationCode: string;
  amount: number;
  expectedAvailability: string;
  depositDate: string;
  note: string;
}

interface DepositHistory {
  id: string;
  confirmationCode: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  depositDate: string;
  availableDate: string;
  note: string;
  checkImage: string; // Base64 image data
}

// Mock deposit history data
const mockDepositHistory: DepositHistory[] = [
  {
    id: '1',
    confirmationCode: 'CHK-2024-001',
    amount: 1250.00,
    status: 'completed',
    depositDate: '2024-01-18T10:30:00Z',
    availableDate: '2024-01-20T09:00:00Z',
    note: 'Payroll check from ABC Corp',
    checkImage: 'check-001.jpg'
  },
  {
    id: '2',
    confirmationCode: 'CHK-2024-002',
    amount: 750.50,
    status: 'completed',
    depositDate: '2024-01-15T14:20:00Z',
    availableDate: '2024-01-17T09:00:00Z',
    note: 'Tax refund check',
    checkImage: 'check-002.jpg'
  },
  {
    id: '3',
    confirmationCode: 'CHK-2024-003',
    amount: 2000.00,
    status: 'processing',
    depositDate: '2024-01-22T16:45:00Z',
    availableDate: '2024-01-24T09:00:00Z',
    note: 'Insurance settlement check',
    checkImage: 'check-003.jpg'
  },
  {
    id: '4',
    confirmationCode: 'CHK-2024-004',
    amount: 500.00,
    status: 'failed',
    depositDate: '2024-01-20T11:15:00Z',
    availableDate: 'N/A',
    note: 'Personal check from friend',
    checkImage: 'check-004.jpg'
  }
];

export default function CheckDeposit() {
  const [form, setForm] = useState<CheckDepositForm>({
    checkImage: null,
    amount: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<DepositConfirmation | null>(null);
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([]);

  useEffect(() => {
    setDepositHistory(mockDepositHistory);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCameraCapture = (imageData: string) => {
    setForm(prev => ({ ...prev, checkImage: imageData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate confirmation data
      const confirmation: DepositConfirmation = {
        confirmationCode: generateConfirmationCode('CHK'),
        amount: parseFloat(form.amount),
        expectedAvailability: getExpectedAvailability(2),
        depositDate: formatDateTime(new Date()),
        note: form.note
      };

      setConfirmationData(confirmation);
      setShowConfirmation(true);
      
      // Add to deposit history
      const newDeposit: DepositHistory = {
        id: Date.now().toString(),
        confirmationCode: confirmation.confirmationCode,
        amount: confirmation.amount,
        status: 'processing',
        depositDate: confirmation.depositDate,
        availableDate: confirmation.expectedAvailability,
        note: confirmation.note,
        checkImage: form.checkImage || 'check-upload.jpg'
      };
      
      setDepositHistory(prev => [newDeposit, ...prev]);
      
      // Reset form
      setForm({
        checkImage: null,
        amount: '',
        note: ''
      });

    } catch (error) {
      console.error('Check deposit failed:', error);
      alert('Check deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'processing': { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tableColumns = [
    {
      key: 'confirmationCode',
      label: 'Confirmation #',
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (
        <span className="font-semibold text-gray-900">{formatUSD(value)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'depositDate',
      label: 'Deposit Date',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      )
    },
    {
      key: 'availableDate',
      label: 'Available Date',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value === 'N/A' ? 'N/A' : formatDate(value)}</span>
      )
    },
    {
      key: 'note',
      label: 'Note',
      render: (value: string) => (
        <div className="max-w-xs">
          <div className="text-sm text-gray-600 truncate">{value || 'No note'}</div>
        </div>
      )
    },
    {
      key: 'checkImage',
      label: 'Check Photo',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {value && value.startsWith('data:image') ? (
            <img
              src={value}
              alt="Check"
              className="w-12 h-8 object-cover rounded border border-gray-200"
            />
          ) : (
            <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <Image className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check Deposit</h1>
        <p className="text-gray-600 mt-1">Deposit checks by taking photos with your device's camera.</p>
      </div>

      {/* Check Deposit Form */}
      <div className="max-w-2xl">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Check Image Capture */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Check Photo <span className="text-red-500">*</span>
              </label>
              
              {form.checkImage ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={form.checkImage}
                      alt="Captured check"
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, checkImage: null }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Retake Photo</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center space-y-2"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-600 font-medium">Take Check Photo</span>
                  <span className="text-sm text-gray-500">Click to open camera</span>
                </button>
              )}
            </div>

            {/* Amount */}
            <FormInput
              label="Check Amount (USD)"
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
              placeholder="Add a note for this deposit (e.g., 'Payroll check from ABC Corp')"
            />

            {/* Submit Button */}
            <LoadingButton
              loading={loading}
              disabled={!form.checkImage}
              type="submit"
              loadingText="Processing Deposit..."
            >
              <Send className="w-4 h-4 mr-2" />
              Deposit Check
            </LoadingButton>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Check Deposit Successful"
      >
        {confirmationData && (
          <>
            {/* Bank Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-primary-600">Navy Federal Credit Union</h3>
              <p className="text-sm text-gray-600">Check Deposit Confirmation</p>
            </div>

            {/* Confirmation Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Confirmation Code:</span>
                <span className="text-sm font-mono text-gray-900">{confirmationData.confirmationCode}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="text-lg font-bold text-gray-900">{formatUSD(confirmationData.amount)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Deposit Date:</span>
                <span className="text-sm text-gray-900">{confirmationData.depositDate}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Expected Availability:</span>
                <div className="text-right">
                  <div className="text-sm text-gray-900">{confirmationData.expectedAvailability}</div>
                  <div className="text-xs text-gray-500">(2 business days)</div>
                </div>
              </div>

              {confirmationData.note && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Note:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">{confirmationData.note}</span>
                </div>
              )}
            </div>

            {/* Important Information */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Processing Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your check will be processed within 1-2 business days. You'll receive a notification once the funds are available in your account.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-4">
                Please save this confirmation for your records. You can view the status in your transaction history.
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

      {/* Deposit History Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Deposit History</h2>
          </div>
          <div className="text-sm text-gray-600">
            {depositHistory.length} deposit{depositHistory.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DataTable
          data={depositHistory}
          columns={tableColumns}
          itemsPerPage={10}
          searchable={true}
          searchPlaceholder="Search deposits..."
        />
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
