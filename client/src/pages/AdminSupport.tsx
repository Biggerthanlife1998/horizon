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
  User,
  Search,
  Filter,
  Eye,
  Reply
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
  userId: string;
  userName: string;
  userEmail: string;
  adminNotes?: string;
  adminResponse?: string;
  assignedTo?: string;
}

interface AdminResponseForm {
  response: string;
  status: string;
  priority: string;
  adminNotes: string;
}

// Mock admin ticket data
const mockAdminTickets: SupportTicket[] = [
  {
    id: '1',
    subject: 'Card not working at ATM',
    message: 'My debit card is being declined at ATMs even though I have sufficient funds. This started happening yesterday.',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-20T09:30:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    ticketNumber: 'TKT-2024-001',
    category: 'Card Issues',
    userId: 'user1',
    userName: 'John Smith',
    userEmail: 'john.smith@email.com',
    assignedTo: 'admin1'
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
    category: 'Account Services',
    userId: 'user2',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.j@email.com',
    adminNotes: 'Customer has good credit history, request seems legitimate',
    assignedTo: 'admin2'
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
    category: 'Technical Support',
    userId: 'user3',
    userName: 'Mike Davis',
    userEmail: 'mike.davis@email.com',
    adminResponse: 'Issue resolved by resetting user password and clearing app cache.',
    assignedTo: 'admin1'
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
    category: 'Online Banking',
    userId: 'user4',
    userName: 'Emily Wilson',
    userEmail: 'emily.w@email.com',
    adminResponse: 'Browser compatibility issue resolved. User can now download statements.',
    assignedTo: 'admin2'
  },
  {
    id: '5',
    subject: 'Unauthorized transaction alert',
    message: 'I see a $500 charge on my account that I did not make. Please investigate immediately.',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-22T15:30:00Z',
    updatedAt: '2024-01-22T15:30:00Z',
    ticketNumber: 'TKT-2024-005',
    category: 'Security Concerns',
    userId: 'user5',
    userName: 'Robert Brown',
    userEmail: 'robert.brown@email.com',
    assignedTo: 'admin1'
  }
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

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseForm, setResponseForm] = useState<AdminResponseForm>({
    response: '',
    status: '',
    priority: '',
    adminNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    setTickets(mockAdminTickets);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResponseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseForm({
      response: ticket.adminResponse || '',
      status: ticket.status,
      priority: ticket.priority,
      adminNotes: ticket.adminNotes || ''
    });
    setShowTicketModal(true);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update ticket
      const updatedTickets = tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? {
              ...ticket,
              status: responseForm.status as 'open' | 'in-progress' | 'resolved' | 'closed',
              priority: responseForm.priority as 'low' | 'medium' | 'high',
              adminResponse: responseForm.response,
              adminNotes: responseForm.adminNotes,
              updatedAt: new Date().toISOString()
            }
          : ticket
      );

      setTickets(updatedTickets);
      setShowTicketModal(false);
      setSelectedTicket(null);
      setResponseForm({ response: '', status: '', priority: '', adminNotes: '' });
      
      alert('Ticket updated successfully!');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket. Please try again.');
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      key: 'userName',
      label: 'Customer',
      render: (value: string, ticket: SupportTicket) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{ticket.userEmail}</div>
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
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, ticket: SupportTicket) => (
        <LoadingButton
          loading={false}
          onClick={() => handleViewTicket(ticket)}
          className="btn-secondary text-xs"
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </LoadingButton>
      )
    }
  ];

  const getStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const highPriority = tickets.filter(t => t.priority === 'high').length;

    return { total, open, inProgress, resolved, highPriority };
  };

  const stats = getStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage customer support tickets and provide assistance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700">Total Tickets</div>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-900">{stats.open}</div>
              <div className="text-sm text-yellow-700">Open</div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <AlertCircle className="w-8 h-8 text-orange-600" />
          <div>
            <div className="text-2xl font-bold text-orange-900">{stats.inProgress}</div>
            <div className="text-sm text-orange-700">In Progress</div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
              <div className="text-sm text-green-700">Resolved</div>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-900">{stats.highPriority}</div>
              <div className="text-sm text-red-700">High Priority</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets, customers, or ticket numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredTickets}
          columns={tableColumns}
          itemsPerPage={15}
          searchable={false}
        />
      </div>

      {/* Ticket Details Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title={`Ticket ${selectedTicket?.ticketNumber}`}
        maxWidth="max-w-4xl"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{selectedTicket.userName}</span>
                    </div>
                    <div className="text-sm text-gray-600">{selectedTicket.userEmail}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subject:</span>
                      <span className="text-sm font-medium">{selectedTicket.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="text-sm font-medium">{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm font-medium">{formatDate(selectedTicket.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Message</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>
            </div>

            {/* Admin Response Form */}
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Admin Response</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Status"
                  name="status"
                  type="select"
                  value={responseForm.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select status...</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </FormInput>

                <FormInput
                  label="Priority"
                  name="priority"
                  type="select"
                  value={responseForm.priority}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select priority...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </FormInput>
              </div>

              <FormInput
                label="Response to Customer"
                name="response"
                type="textarea"
                value={responseForm.response}
                onChange={handleInputChange}
                placeholder="Type your response to the customer..."
                rows={4}
              />

              <FormInput
                label="Internal Notes"
                name="adminNotes"
                type="textarea"
                value={responseForm.adminNotes}
                onChange={handleInputChange}
                placeholder="Internal notes (not visible to customer)..."
                rows={3}
              />

              <div className="flex space-x-3 pt-4">
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
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Update Ticket
                </LoadingButton>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
