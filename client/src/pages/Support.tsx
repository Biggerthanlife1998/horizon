import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import DataTable from '@/components/DataTable';
import { 
  HelpCircle, 
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Calendar,
  User
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  ticketNumber: string;
  category: string;
}

interface TicketForm {
  subject: string;
  message: string;
  category: string;
  priority: string;
}

// Mock ticket data
const mockTickets: SupportTicket[] = [
  {
    id: '1',
    subject: 'Card not working at ATM',
    message: 'My debit card is being declined at ATMs even though I have sufficient funds. This started happening yesterday.',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-20T09:30:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    ticketNumber: 'TKT-2024-001',
    category: 'Card Issues'
  },
  {
    id: '2',
    subject: 'Transfer limit increase request',
    message: 'I need to increase my daily transfer limit from $1,000 to $5,000 for an upcoming large purchase.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2024-01-19T14:15:00Z',
    updatedAt: '2024-01-20T10:45:00Z',
    ticketNumber: 'TKT-2024-002',
    category: 'Account Services'
  },
  {
    id: '3',
    subject: 'Mobile app login issue',
    message: 'I cannot log into the mobile app. It keeps saying "Invalid credentials" even though I know my password is correct.',
    status: 'resolved',
    priority: 'high',
    createdAt: '2024-01-18T11:20:00Z',
    updatedAt: '2024-01-19T16:30:00Z',
    ticketNumber: 'TKT-2024-003',
    category: 'Technical Support'
  },
  {
    id: '4',
    subject: 'Statement download problem',
    message: 'I am unable to download my monthly statement as PDF. The download button is not responding.',
    status: 'closed',
    priority: 'low',
    createdAt: '2024-01-17T08:45:00Z',
    updatedAt: '2024-01-18T12:15:00Z',
    ticketNumber: 'TKT-2024-004',
    category: 'Online Banking'
  }
];

const TICKET_CATEGORIES = [
  'Account Services',
  'Card Issues',
  'Online Banking',
  'Mobile App',
  'Technical Support',
  'Billing & Payments',
  'Security Concerns',
  'General Inquiry'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
];

const STATUS_CONFIG = {
  'open': { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" /> },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> },
  'resolved': { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  'closed': { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> }
};

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    subject: '',
    message: '',
    category: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTickets(mockTickets);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate new ticket
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        subject: ticketForm.subject,
        message: ticketForm.message,
        status: 'open',
        priority: ticketForm.priority as 'low' | 'medium' | 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ticketNumber: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
        category: ticketForm.category
      };

      setTickets(prev => [newTicket, ...prev]);
      
      // Reset form
      setTicketForm({
        subject: '',
        message: '',
        category: '',
        priority: 'medium'
      });
      setShowTicketModal(false);
      alert('Support ticket submitted successfully!');
    } catch (error) {
      console.error('Ticket submission failed:', error);
      alert('Ticket submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_LEVELS.find(p => p.value === priority);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
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
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (value: string) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{value}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value: string) => getPriorityBadge(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{formatDate(value)}</span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-1">Get help with your account and submit support tickets.</p>
        </div>
        <LoadingButton
          loading={false}
          onClick={() => setShowTicketModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </LoadingButton>
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-3">
                Submit a support ticket and we'll get back to you within 24 hours.
              </p>
              <LoadingButton
                loading={false}
                onClick={() => setShowTicketModal(true)}
                className="btn-primary text-sm"
              >
                Submit Ticket
              </LoadingButton>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Response Time</h3>
              <p className="text-green-700 text-sm">
                We typically respond to tickets within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-purple-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Track Progress</h3>
              <p className="text-purple-700 text-sm">
                Monitor the status of your tickets and view our responses here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">My Support Tickets</h2>
          </div>
          <div className="text-sm text-gray-600">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DataTable
          data={tickets}
          columns={tableColumns}
          itemsPerPage={10}


        />
      </div>

      {/* Submit Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Submit Support Ticket"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitTicket} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Category"
              name="category"
              type="select"
              value={ticketForm.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category...</option>
              {TICKET_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FormInput>

            <FormInput
              label="Priority"
              name="priority"
              type="select"
              value={ticketForm.priority}
              onChange={handleInputChange}
              required
            >
              {PRIORITY_LEVELS.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </FormInput>
          </div>

          <FormInput
            label="Subject"
            name="subject"
            type="text"
            value={ticketForm.subject}
            onChange={handleInputChange}
            placeholder="Brief description of your issue"
            required
            maxLength={100}
          />

          <FormInput
            label="Message"
            name="message"
            type="textarea"
            value={ticketForm.message}
            onChange={handleInputChange}
            placeholder="Please provide detailed information about your issue..."
            required
            rows={6}
            maxLength={1000}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Tips for Faster Resolution</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Provide specific details about your issue</li>
                  <li>• Include any error messages you're seeing</li>
                  <li>• Mention what you've already tried</li>
                  <li>• Include relevant account information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <LoadingButton
              loading={false}
              onClick={() => setShowTicketModal(false)}
              className="btn-secondary"
              type="button"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              loading={loading}
              type="submit"
              className="btn-primary"
              disabled={!ticketForm.subject || !ticketForm.message || !ticketForm.category}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Submit Ticket
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}








